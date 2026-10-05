/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import { downloadFileContent, FILE_DOWNLOAD_BLOCK_SIZE as BLOCK_SIZE, FileContentDownloadError, IFileDownloadDependencies, IFileDownloadOptions, IFileDownloadResponse } from "../../services/fileContentDownloadService";
import { IWebExtensionFileDownloadTelemetryData } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryInterface";
import { webExtensionTelemetryEventNames as Events } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";

const response = (status: number, body: unknown = {}, retryAfter: string | null = null): IFileDownloadResponse => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => retryAfter },
    json: async () => body,
});

describe("fileContentDownloadService", () => {
    let options: IFileDownloadOptions;
    let dependencies: IFileDownloadDependencies;
    let request: sinon.SinonStub;
    let commit: sinon.SinonStub;
    let delay: sinon.SinonStub;
    let events: { event: Events; data: IWebExtensionFileDownloadTelemetryData }[];

    beforeEach(() => {
        request = sinon.stub();
        commit = sinon.stub().resolves();
        delay = sinon.stub().resolves();
        events = [];
        options = {
            requestUrl: 'https://example.test/api/data/v9.2/powerpagecomponents(id)/filecontent',
            actionUrl: 'https://example.test/api/data/v9.2',
            entityId: 'id',
            schema: 'enhanced',
            featureEnabled: true,
            mode: 'lazy',
            commit,
        };
        dependencies = { request, delay, telemetry: (event, data) => events.push({ event, data }) };
    });

    const metadata = (size: number, chunking = true) => ({
        FileSizeInBytes: size, FileContinuationToken: 'private-token', IsChunkingSupported: chunking,
    });

    const expectTerminal = (outcome: string, stage?: string) => {
        expect(events.filter(e => e.event === Events.WEB_EXTENSION_FILE_DOWNLOAD_STARTED)).to.have.length(1);
        const terminals = events.filter(e => e.event === Events.WEB_EXTENSION_FILE_DOWNLOAD_COMPLETED);
        expect(terminals).to.have.length(1);
        expect(terminals[0].data.outcome).to.equal(outcome);
        expect(terminals[0].data.failureStage).to.equal(stage);
        expect(new Set(events.map(e => e.data.downloadOperationId)).size).to.equal(1);
        expect(JSON.stringify(events)).not.to.include('private-token');
        return terminals[0].data;
    };

    const expectFailure = async (stage: string, outcome = 'failed') => {
        let caught: unknown;
        try {
            await downloadFileContent(options, dependencies);
        } catch (error) {
            caught = error;
        }
        expect(caught).to.be.instanceOf(Error);
        expectTerminal(outcome, stage);
        expect(commit.called).to.equal(false);
    };

    it("preserves the successful small GET and commits byte-exact content once", async () => {
        request.resolves(response(200, { value: 'AAH+/w==' }));
        await downloadFileContent(options, dependencies);
        expect(request.callCount).to.equal(1);
        expect(request.firstCall.args.slice(0, 3)).to.deep.equal([options.requestUrl, 'GET', undefined]);
        expect(commit.callCount).to.equal(1);
        expect(Array.from(commit.firstCall.args[0])).to.deep.equal([0, 1, 254, 255]);
        expect(events).to.have.length(2);
        expectTerminal('succeeded');
    });

    for (const size of [0, BLOCK_SIZE - 1, BLOCK_SIZE, BLOCK_SIZE + 1, BLOCK_SIZE * 2, BLOCK_SIZE * 3, 18_000_000, 104_000_000]) {
        it(`recovers and byte-matches ${size} bytes without an extra EOF block`, async () => {
            const expected = new Uint8Array(size);
            for (let index = 0; index < size; index++) {
                expected[index] = (index * 31 + Math.floor(index / BLOCK_SIZE)) % 256;
            }
            request.callsFake(async (_url: string, method: string, body?: string) => {
                if (method === 'GET') {
                    return response(413);
                }
                const payload: Record<string, unknown> = JSON.parse(body ?? '{}');
                if ('Target' in payload) {
                    expect(payload).to.deep.equal({
                        Target: { '@odata.type': 'Microsoft.Dynamics.CRM.powerpagecomponent', powerpagecomponentid: 'id' },
                        FileAttributeName: 'filecontent',
                    });
                    return response(200, metadata(size));
                }
                const offset = Number(payload.Offset);
                const length = Number(payload.BlockLength);
                expect(length).to.equal(Math.min(BLOCK_SIZE, size - offset));
                expect(length).to.be.greaterThan(0);
                return response(200, { Data: Buffer.from(expected.subarray(offset, offset + length)).toString('base64') });
            });
            await downloadFileContent(options, dependencies);
            const actual: Uint8Array = commit.firstCall.args[0];
            expect(actual.byteLength).to.equal(size);
            expect(Buffer.compare(Buffer.from(actual.buffer), Buffer.from(expected.buffer))).to.equal(0);
            expect(request.callCount).to.equal(2 + Math.ceil(size / BLOCK_SIZE));
            expect(commit.callCount).to.equal(1);
            const terminal = expectTerminal('succeeded');
            expect(terminal.initialHttpStatus).to.equal(413);
            expect(terminal.blockCount).to.equal(Math.ceil(size / BLOCK_SIZE));
            expect(events.filter(e => e.event === Events.WEB_EXTENSION_FILE_DOWNLOAD_FALLBACK_STARTED)).to.have.length(1);
        }).timeout(30000);
    }

    it("accepts a genuinely empty small-file value without substituting NO_CONTENT", async () => {
        request.resolves(response(200, { value: '' }));
        await downloadFileContent(options, dependencies);
        expect(commit.firstCall.args[0].byteLength).to.equal(0);
        expectTerminal('succeeded');
    });

    for (const invalid of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '18', undefined]) {
        it(`rejects invalid advertised size ${String(invalid)}`, async () => {
            request.onCall(0).resolves(response(413));
            request.onCall(1).resolves(response(200, { ...metadata(1), FileSizeInBytes: invalid }));
            await expectFailure('initialize');
            expect(request.callCount).to.equal(2);
        });
    }

    for (const invalid of [{ FileContinuationToken: '' }, { FileContinuationToken: ' ' }, { FileContinuationToken: 4 }, { IsChunkingSupported: undefined }, { IsChunkingSupported: 'true' }]) {
        it(`rejects invalid initialization ${JSON.stringify(invalid)}`, async () => {
            request.onCall(0).resolves(response(413));
            request.onCall(1).resolves(response(200, { ...metadata(1), ...invalid }));
            await expectFailure('initialize');
        });
    }

    it("fails explicitly when the advertised file cannot be allocated", async () => {
        request.onCall(0).resolves(response(413));
        request.onCall(1).resolves(response(200, metadata(Number.MAX_SAFE_INTEGER)));
        await expectFailure('validation');
        expect(request.callCount).to.equal(2);
    });

    for (const invalid of ['!', 'A', '=AAA', 'AA=A', 'AAAA====', 'AA==', 'AAAA', 'AAB=', null, undefined]) {
        it(`rejects malformed, short or overlong block data ${String(invalid)}`, async () => {
            request.onCall(0).resolves(response(413));
            request.onCall(1).resolves(response(200, metadata(2)));
            request.onCall(2).resolves(response(200, { Data: invalid }));
            await expectFailure('validation');
        });
    }

    it("rejects invalid base64 characters even when permissive Buffer decoding yields the expected length", async () => {
        const corrupt = 'AA!BAg==';
        expect(Buffer.from(corrupt, 'base64').byteLength).to.equal(3);
        request.onCall(0).resolves(response(413));
        request.onCall(1).resolves(response(200, metadata(3)));
        request.onCall(2).resolves(response(200, { Data: corrupt }));
        await expectFailure('validation');
    });

    for (const status of [400, 401, 403, 404, 500]) {
        it(`preserves permanent initial GET HTTP ${status} without starting fallback`, async () => {
            request.resolves(response(status));
            await expectFailure('get', status === 404 ? 'notFound' : 'failed');
            expect(request.callCount).to.equal(1);
            expect(events).to.have.length(2);
        });
    }

    it("retries only the failed block, honors Retry-After and retains completed blocks", async () => {
        request.onCall(0).resolves(response(413));
        request.onCall(1).resolves(response(200, metadata(BLOCK_SIZE + 1)));
        request.onCall(2).resolves(response(200, { Data: Buffer.alloc(BLOCK_SIZE, 19).toString('base64') }));
        request.onCall(3).resolves(response(429, {}, '2'));
        request.onCall(4).resolves(response(200, { Data: 'FA==' }));
        await downloadFileContent(options, dependencies);
        expect(request.getCall(3).args[2]).to.equal(request.getCall(4).args[2]);
        expect(delay.firstCall.args[0]).to.equal(2000);
        const bytes: Uint8Array = commit.firstCall.args[0];
        expect(bytes[0]).to.equal(19);
        expect(bytes[BLOCK_SIZE]).to.equal(20);
        expect(expectTerminal('succeeded').retryCount).to.equal(1);
    });

    it("honors a Retry-After HTTP date", async () => {
        const clock = sinon.useFakeTimers({ now: Date.UTC(2026, 0, 1), toFake: ['Date'] });
        try {
            request.onCall(0).resolves(response(413));
            request.onCall(1).resolves(response(503, {}, new Date(Date.now() + 3000).toUTCString()));
            request.onCall(2).resolves(response(200, metadata(0)));
            await downloadFileContent(options, dependencies);
            expect(delay.firstCall.args[0]).to.equal(3000);
        } finally {
            clock.restore();
        }
    });

    it("fails rather than ignoring an excessive Retry-After or waiting indefinitely", async () => {
        request.onCall(0).resolves(response(413));
        request.onCall(1).resolves(response(429, {}, '120'));
        await expectFailure('initialize');
        expect(delay.called).to.equal(false);
    });

    it("exhausts bounded HTTP retries visibly without committing partial bytes", async () => {
        request.onCall(0).resolves(response(413));
        request.onCall(1).resolves(response(200, metadata(2)));
        request.resolves(response(503));
        await expectFailure('block');
        expect(request.callCount).to.equal(5);
        expect(delay.callCount).to.equal(2);
        expect(events[events.length - 1].data.retryCount).to.equal(2);
    });

    for (const status of [400, 401, 403, 404, 413]) {
        it(`does not retry permanent block HTTP ${status}`, async () => {
            request.onCall(0).resolves(response(413));
            request.onCall(1).resolves(response(200, metadata(2)));
            request.onCall(2).resolves(response(status));
            await expectFailure('block', status === 404 ? 'notFound' : 'failed');
            expect(request.callCount).to.equal(3);
        });
    }

    it("uses one full-size block for unsupported chunking", async () => {
        const size = BLOCK_SIZE + 1;
        request.onCall(0).resolves(response(413));
        request.onCall(1).resolves(response(200, metadata(size, false)));
        request.onCall(2).resolves(response(200, { Data: Buffer.alloc(size, 33).toString('base64') }));
        await downloadFileContent(options, dependencies);
        expect(JSON.parse(request.getCall(2).args[2]).BlockLength).to.equal(size);
        expect(request.callCount).to.equal(3);
        expect(expectTerminal('succeeded').mechanism).to.equal('singleBlock');
    });

    it("does not loop when the unsupported-chunking full-size request also returns 413", async () => {
        request.onCall(0).resolves(response(413));
        request.onCall(1).resolves(response(200, metadata(18_000_000, false)));
        request.onCall(2).resolves(response(413));
        await expectFailure('block');
        expect(request.callCount).to.equal(3);
    });

    it("instruments disabled fallback with the same logical denominator but no POST", async () => {
        options.featureEnabled = false;
        request.resolves(response(413));
        await expectFailure('get');
        expect(request.callCount).to.equal(1);
        expect(events).to.have.length(2);
        expect(events[1].data.featureEnabled).to.equal(false);
    });

    it("does not add another retry policy around transport failures", async () => {
        request.rejects(new Error('transport retries already exhausted'));
        await expectFailure('get');
        expect(request.callCount).to.equal(1);
    });

    it("records actual lower-level auth/network retries without inflating starts", async () => {
        request.callsFake(async (_url, _method, _body, onRetry: () => void) => {
            onRetry();
            onRetry();
            return response(200, { value: 'AA==' });
        });
        await downloadFileContent(options, dependencies);
        expect(expectTerminal('succeeded').retryCount).to.equal(2);
    });

    it("emits cancellation once and never emits success", async () => {
        const error = new Error('cancelled');
        error.name = 'AbortError';
        request.rejects(error);
        await expectFailure('get', 'cancelled');
    });

    it("never emits success before VFS commit resolves, or when it rejects", async () => {
        request.resolves(response(200, { value: 'AA==' }));
        let rejectCommit: (error: Error) => void = () => expect.fail('commit was not started');
        commit.callsFake(() => new Promise<void>((_resolve, reject) => { rejectCommit = reject; }));
        const pending = downloadFileContent(options, dependencies);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        expect(events).to.have.length(1);
        rejectCommit(new Error('VFS write failed'));
        let caught: unknown;
        try {
            await pending;
        } catch (error) {
            caught = error;
        }
        expect(caught).to.be.instanceOf(FileContentDownloadError);
        expectTerminal('failed', 'commit');
        expect(commit.callCount).to.equal(1);
    });
}).timeout(30000);
