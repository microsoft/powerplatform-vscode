/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import sinon, { stub, assert } from "sinon";
import * as fetch from "node-fetch";
import { ConcurrencyHandler } from "../../dal/concurrencyHandler";
import WebExtensionContext from "../../WebExtensionContext";
import { webExtensionTelemetryEventNames } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";

describe("ConcurrencyHandler", () => {
    let sendInfoTelemetryStub: sinon.SinonStub;
    let sendErrorTelemetryStub: sinon.SinonStub;

    beforeEach(() => {
        sendInfoTelemetryStub = stub(WebExtensionContext.telemetry, "sendInfoTelemetry");
        sendErrorTelemetryStub = stub(WebExtensionContext.telemetry, "sendErrorTelemetry");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("handleRequest", () => {
        it("should return response on successful first attempt", async () => {
            const mockResponse = { ok: true, status: 200 };
            const fetchStub = stub(fetch, "default").resolves(mockResponse as unknown as fetch.Response);

            const handler = new ConcurrencyHandler();
            const result = await handler.handleRequest("https://test.com/api");

            expect(result).to.equal(mockResponse);
            assert.calledOnce(fetchStub);
            assert.notCalled(sendInfoTelemetryStub);
        });

        it("should not retry BulkheadRejectedError and throw immediately", async () => {
            // To test BulkheadRejectedError behavior, we verify the error handling
            // when the bulkhead throws a rejection error.
            const { BulkheadRejectedError } = await import("cockatiel");

            // Create a mock that throws BulkheadRejectedError (requires executionSlots and queueSlots)
            const fetchStub = stub(fetch, "default").callsFake(() => {
                throw new BulkheadRejectedError(50, 6000);
            });

            const handler = new ConcurrencyHandler();

            try {
                await handler.handleRequest("https://test.com/api");
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect((error as Error).message).to.include("Bulkhead queue limits exceeded");
            }

            // Should only attempt once - no retries for BulkheadRejectedError
            assert.calledOnce(fetchStub);
            // Should log error telemetry for bulkhead rejection with an Error
            // object so executionSlots/retryCount actually land in the payload.
            assert.calledOnce(sendErrorTelemetryStub);
            const call = sendErrorTelemetryStub.getCalls()[0];
            expect(call.args[0]).to.equal(webExtensionTelemetryEventNames.WEB_EXTENSION_BULKHEAD_QUEUE_FULL);
            expect(call.args[1]).to.equal("handleRequest");
            expect(call.args[2]).to.match(/executionSlots:.*retryCount:/);
            expect(call.args[3]).to.be.instanceOf(Error);
            expect((call.args[3] as Error).message).to.equal(call.args[2] as string);
        });

        it("should pass request info and init to fetch", async () => {
            const mockResponse = { ok: true, status: 200 };
            const fetchStub = stub(fetch, "default").resolves(mockResponse as unknown as fetch.Response);
            const requestInit = { headers: { "Authorization": "Bearer token" } };

            const handler = new ConcurrencyHandler();
            await handler.handleRequest("https://test.com/api", requestInit);

            assert.calledOnce(fetchStub);
            assert.calledWith(fetchStub, "https://test.com/api", requestInit);
        });
    });

    describe("handleRequest 401 token refresh", () => {
        it("should refresh token and retry once on 401, returning the retried success", async () => {
            const unauthorized = { ok: false, status: 401 };
            const success = { ok: true, status: 200 };
            const fetchStub = stub(fetch, "default")
                .onFirstCall().resolves(unauthorized as unknown as fetch.Response)
                .onSecondCall().resolves(success as unknown as fetch.Response);
            const onUnauthorized = stub().resolves("fresh-token");

            const handler = new ConcurrencyHandler();
            const requestInit = { headers: { authorization: "Bearer stale-token", "content-type": "application/json" } };
            const result = await handler.handleRequest("https://test.com/api", requestInit, onUnauthorized);

            expect(result).to.equal(success);
            assert.calledOnce(onUnauthorized);
            assert.calledTwice(fetchStub);
            // Retried request must carry the refreshed token while preserving other headers.
            const retriedInit = fetchStub.getCall(1).args[1] as { headers: Record<string, string> };
            expect(retriedInit.headers.authorization).to.equal("Bearer fresh-token");
            expect(retriedInit.headers["content-type"]).to.equal("application/json");
        });

        it("should not loop when the retried request also returns 401", async () => {
            const unauthorized = { ok: false, status: 401 };
            const fetchStub = stub(fetch, "default").resolves(unauthorized as unknown as fetch.Response);
            const onUnauthorized = stub().resolves("fresh-token");

            const handler = new ConcurrencyHandler();
            const result = await handler.handleRequest(
                "https://test.com/api",
                { headers: { authorization: "Bearer stale-token" } },
                onUnauthorized
            );

            expect((result as unknown as { status: number }).status).to.equal(401);
            assert.calledOnce(onUnauthorized);
            assert.calledTwice(fetchStub);
        });

        it("should fail-fast (no retry) when refresh returns an empty token", async () => {
            const unauthorized = { ok: false, status: 401 };
            const fetchStub = stub(fetch, "default").resolves(unauthorized as unknown as fetch.Response);
            const onUnauthorized = stub().resolves("");

            const handler = new ConcurrencyHandler();
            const result = await handler.handleRequest(
                "https://test.com/api",
                { headers: { authorization: "Bearer stale-token" } },
                onUnauthorized
            );

            expect((result as unknown as { status: number }).status).to.equal(401);
            assert.calledOnce(onUnauthorized);
            assert.calledOnce(fetchStub);
        });

        it("should return 401 as-is when no onUnauthorized provider is supplied (back-compat)", async () => {
            const unauthorized = { ok: false, status: 401 };
            const fetchStub = stub(fetch, "default").resolves(unauthorized as unknown as fetch.Response);

            const handler = new ConcurrencyHandler();
            const result = await handler.handleRequest("https://test.com/api", {
                headers: { authorization: "Bearer stale-token" },
            });

            expect((result as unknown as { status: number }).status).to.equal(401);
            assert.calledOnce(fetchStub);
        });

        it("should not invoke the provider on a successful first response", async () => {
            const success = { ok: true, status: 200 };
            const fetchStub = stub(fetch, "default").resolves(success as unknown as fetch.Response);
            const onUnauthorized = stub().resolves("fresh-token");

            const handler = new ConcurrencyHandler();
            const result = await handler.handleRequest("https://test.com/api", undefined, onUnauthorized);

            expect(result).to.equal(success);
            assert.notCalled(onUnauthorized);
            assert.calledOnce(fetchStub);
        });
    });
});
