/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { FileDownloadMode, FileDownloadStage, IWebExtensionFileDownloadTelemetryData } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryInterface";
import { webExtensionTelemetryEventNames as Events } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { RETRY_INITIAL_DELAY_MS, RETRY_MAX_ATTEMPTS, RETRY_MAX_DELAY_MS } from "../common/constants";

export const FILE_DOWNLOAD_BLOCK_SIZE = 4 * 1024 * 1024;

export interface IFileDownloadResponse {
    ok: boolean;
    status: number;
    headers: { get(name: string): string | null };
    json(): Promise<unknown>;
}

export interface IFileDownloadDependencies {
    request(url: string, method: 'GET' | 'POST', body: string | undefined, onRetry: () => void): Promise<IFileDownloadResponse>;
    telemetry(event: Events, data: IWebExtensionFileDownloadTelemetryData): void;
    delay?(milliseconds: number): Promise<void>;
}

export interface IFileDownloadOptions {
    requestUrl: string;
    actionUrl: string;
    entityId: string;
    mode: FileDownloadMode;
    schema: string;
    featureEnabled: boolean;
    commit(bytes: Uint8Array): Promise<void>;
}

export class FileContentDownloadError extends Error {
    constructor(public readonly stage: FileDownloadStage, public readonly status?: number) {
        super(`File content download failed (${stage}${status === undefined ? '' : `, HTTP ${status}`})`);
        this.name = 'FileContentDownloadError';
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Strictly decodes one independent base64 payload, without a whole-file base64 copy.
 */
function decodeContent(value: unknown, expectedLength?: number): Uint8Array {
    if (typeof value !== 'string' || value.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(value)) {
        throw new FileContentDownloadError('validation');
    }
    const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
    if (value.slice(0, value.length - padding).includes('=')
        || (expectedLength !== undefined && value.length / 4 * 3 - padding !== expectedLength)) {
        throw new FileContentDownloadError('validation');
    }
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    if (padding > 0 && (alphabet.indexOf(value[value.length - padding - 1]) & (padding === 2 ? 15 : 3)) !== 0) {
        throw new FileContentDownloadError('validation');
    }
    const decoded = atob(value);
    const bytes = new Uint8Array(decoded.length);
    for (let index = 0; index < decoded.length; index++) {
        bytes[index] = decoded.charCodeAt(index);
    }
    return bytes;
}

function sizeBucket(size: number): string {
    return size === 0 ? 'empty' : size <= 4 * 1024 * 1024 ? 'upTo4MiB'
        : size <= 16 * 1024 * 1024 ? '4To16MiB'
            : size <= 128 * 1024 * 1024 ? '16To128MiB' : 'over128MiB';
}

/**
 * One logical file load. Its terminal success includes validation and the caller's VFS commit.
 * Transport retries belong to the shared request handler; only transient HTTP responses
 * from block actions are retried here.
 */
export async function downloadFileContent(options: IFileDownloadOptions, dependencies: IFileDownloadDependencies): Promise<void> {
    const startedAt = Date.now();
    const data: IWebExtensionFileDownloadTelemetryData = {
        downloadOperationId: crypto.randomUUID(),
        mode: options.mode,
        schema: options.schema,
        featureEnabled: options.featureEnabled,
        mechanism: 'get',
        sizeBucket: 'unknown',
        blockCount: 0,
        retryCount: 0,
        durationMs: 0,
    };
    let stage: FileDownloadStage = 'get';
    const emit = (event: Events) => {
        data.durationMs = Date.now() - startedAt;
        dependencies.telemetry(event, { ...data });
    };
    const request = async (url: string, method: 'GET' | 'POST', body?: Record<string, unknown>) => {
        for (let attempt = 0; ; attempt++) {
            const response = await dependencies.request(url, method, body ? JSON.stringify(body) : undefined, () => data.retryCount++);
            data.finalHttpStatus = response.status;
            if (method === 'GET') {
                data.initialHttpStatus = response.status;
                return response;
            }
            if (response.ok) {
                return response;
            }
            if (![408, 429, 500, 502, 503, 504].includes(response.status) || attempt >= RETRY_MAX_ATTEMPTS) {
                throw new FileContentDownloadError(stage, response.status);
            }
            const retryAfter = response.headers.get('Retry-After');
            const seconds = retryAfter === null || retryAfter.trim() === '' ? NaN : Number(retryAfter);
            const dateDelay = retryAfter === null ? NaN : Date.parse(retryAfter) - Date.now();
            const serverDelay = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : dateDelay;
            const delay = Number.isFinite(serverDelay) && serverDelay >= 0
                ? serverDelay : Math.min(RETRY_INITIAL_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
            // Do not retry earlier than Retry-After, or leave the worker waiting indefinitely.
            if (delay > RETRY_MAX_DELAY_MS) {
                throw new FileContentDownloadError(stage, response.status);
            }
            await (dependencies.delay ?? ((ms) => new Promise(resolve => setTimeout(resolve, ms))))(delay);
            data.retryCount++;
        }
    };

    emit(Events.WEB_EXTENSION_FILE_DOWNLOAD_STARTED);
    try {
        const response = await request(options.requestUrl, 'GET');
        let bytes: Uint8Array;
        if (response.status === 413 && options.featureEnabled) {
            stage = 'initialize';
            data.mechanism = 'blocks';
            emit(Events.WEB_EXTENSION_FILE_DOWNLOAD_FALLBACK_STARTED);
            const initialized = await request(`${options.actionUrl}/InitializeFileBlocksDownload`, 'POST', {
                Target: {
                    '@odata.type': 'Microsoft.Dynamics.CRM.powerpagecomponent',
                    powerpagecomponentid: options.entityId,
                },
                FileAttributeName: 'filecontent',
            });
            const metadata = await initialized.json();
            if (!isRecord(metadata) || typeof metadata.FileSizeInBytes !== 'number'
                || !Number.isSafeInteger(metadata.FileSizeInBytes) || metadata.FileSizeInBytes < 0
                || typeof metadata.FileContinuationToken !== 'string' || metadata.FileContinuationToken.trim().length === 0
                || typeof metadata.IsChunkingSupported !== 'boolean') {
                throw new FileContentDownloadError('initialize');
            }
            const size = metadata.FileSizeInBytes;
            data.sizeBucket = sizeBucket(size);
            data.mechanism = metadata.IsChunkingSupported ? 'blocks' : 'singleBlock';
            stage = 'validation';
            bytes = new Uint8Array(size);
            let offset = 0;
            while (offset < size) {
                stage = 'block';
                const length = metadata.IsChunkingSupported ? Math.min(FILE_DOWNLOAD_BLOCK_SIZE, size - offset) : size;
                const blockResponse = await request(`${options.actionUrl}/DownloadBlock`, 'POST', {
                    FileContinuationToken: metadata.FileContinuationToken,
                    Offset: offset,
                    BlockLength: length,
                });
                const block = await blockResponse.json();
                stage = 'validation';
                const blockBytes = decodeContent(isRecord(block) ? block.Data : undefined, length);
                bytes.set(blockBytes, offset);
                offset += blockBytes.length;
                data.blockCount++;
            }
            if (offset !== size) {
                throw new FileContentDownloadError('validation');
            }
        } else {
            if (!response.ok) {
                throw new FileContentDownloadError('get', response.status);
            }
            const content = await response.json();
            stage = 'validation';
            bytes = decodeContent(isRecord(content) ? content.value : content);
            data.sizeBucket = sizeBucket(bytes.byteLength);
        }
        stage = 'commit';
        await options.commit(bytes);
        data.outcome = 'succeeded';
    } catch (error) {
        data.failureStage = error instanceof FileContentDownloadError ? error.stage : stage;
        data.outcome = error instanceof Error && error.name === 'AbortError' ? 'cancelled'
            : error instanceof FileContentDownloadError && error.status === 404 ? 'notFound' : 'failed';
        throw error instanceof FileContentDownloadError || data.outcome === 'cancelled'
            ? error : new FileContentDownloadError(stage);
    } finally {
        emit(Events.WEB_EXTENSION_FILE_DOWNLOAD_COMPLETED);
    }
}
