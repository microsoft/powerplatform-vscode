/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { URI_CONSTANTS } from '../constants/uriConstants';
import type { CreateFlowParameters } from '../handlers/createFlowParams';
import type { AgentHost } from './detectAgentHost';

/**
 * Context persisted before reloading VS Code so an agentic create flow can resume.
 */
export interface ResumeMarker {
    host: string;
    timestamp: number;
    correlationId: string | null;
    environmentId: string | null;
    orgUrl: string | null;
    websiteId: string | null;
    source: string | null;
}

/**
 * Minimal persistence contract implemented by VS Code global state.
 */
export interface ResumeMarkerStore {
    get<T>(key: string): T | undefined;
    update(key: string, value: unknown): Thenable<void> | void;
}

/**
 * Builds the complete context required to resume an agentic create flow.
 * @param params Deep-link create-flow parameters.
 * @param host Agent host selected for the flow.
 * @param now Timestamp to persist on the marker.
 * @returns The resumable context marker.
 */
export function buildResumeMarker(
    params: CreateFlowParameters,
    host: AgentHost,
    now: number
): ResumeMarker {
    return {
        host,
        timestamp: now,
        correlationId: params.correlationId,
        environmentId: params.environmentId,
        orgUrl: params.orgUrl,
        websiteId: params.websiteId,
        source: params.source
    };
}

/**
 * Persists a resume marker.
 * @param store Resume-marker persistence store.
 * @param marker Marker to persist.
 */
export async function writeResumeMarker(
    store: ResumeMarkerStore,
    marker: ResumeMarker
): Promise<void> {
    await store.update(URI_CONSTANTS.RESUME_MARKER.KEY, marker);
}

/**
 * Reads the current resume marker.
 * @param store Resume-marker persistence store.
 * @returns The persisted marker, when present.
 */
export function readResumeMarker(store: ResumeMarkerStore): ResumeMarker | undefined {
    return store.get<ResumeMarker>(URI_CONSTANTS.RESUME_MARKER.KEY);
}

/**
 * Removes the current resume marker.
 * @param store Resume-marker persistence store.
 */
export async function clearResumeMarker(store: ResumeMarkerStore): Promise<void> {
    await store.update(URI_CONSTANTS.RESUME_MARKER.KEY, undefined);
}

/**
 * Checks whether a resume marker remains inside the allowed resume window.
 * @param marker Resume marker to evaluate.
 * @param now Current timestamp.
 * @returns True when the marker has not exceeded its TTL.
 */
export function isResumeMarkerFresh(marker: ResumeMarker, now: number): boolean {
    return now - marker.timestamp <= URI_CONSTANTS.RESUME_MARKER.TTL_MS;
}
