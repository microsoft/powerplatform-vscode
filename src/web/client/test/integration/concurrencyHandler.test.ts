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

        it("should retry on transient failure and log telemetry", async () => {
            const mockError = new Error("Network error");
            const mockResponse = { ok: true, status: 200 };
            const fetchStub = stub(fetch, "default");
            fetchStub.onFirstCall().rejects(mockError);
            fetchStub.onSecondCall().resolves(mockResponse as unknown as fetch.Response);

            const handler = new ConcurrencyHandler();
            const result = await handler.handleRequest("https://test.com/api");

            expect(result).to.equal(mockResponse);
            assert.calledTwice(fetchStub);
            assert.calledOnce(sendInfoTelemetryStub);
            assert.calledWith(
                sendInfoTelemetryStub,
                webExtensionTelemetryEventNames.WEB_EXTENSION_REQUEST_RETRY,
                sinon.match({
                    attempt: "1",
                    url: "https://test.com/api"
                })
            );
        });

        it("should respect max attempts and throw after exhausting retries", async () => {
            const mockError = new Error("Persistent network error");
            const fetchStub = stub(fetch, "default").rejects(mockError);

            const handler = new ConcurrencyHandler();

            try {
                await handler.handleRequest("https://test.com/api");
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect((error as Error).message).to.equal("Persistent network error");
            }

            // With maxAttempts: 2, we expect 2 total attempts (1 initial + 1 retry)
            assert.calledTwice(fetchStub);
            // Retry telemetry should be logged once (for the retry attempt)
            assert.calledOnce(sendInfoTelemetryStub);
        });

        it("should not retry BulkheadRejectedError and throw immediately", async () => {
            // To test BulkheadRejectedError behavior, we need to create a handler with
            // a bulkhead that's already full. Since we can't easily mock the bulkhead
            // internal state, we verify the error handling behavior.
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
                expect((error as Error).message).to.include("Bulkhead limits exceeded");
            }

            // Should only attempt once - no retries for BulkheadRejectedError
            assert.calledOnce(fetchStub);
            // Should log error telemetry for bulkhead rejection
            assert.calledOnce(sendErrorTelemetryStub);
            assert.calledWith(
                sendErrorTelemetryStub,
                webExtensionTelemetryEventNames.WEB_EXTENSION_BULKHEAD_QUEUE_FULL,
                "handleRequest",
                sinon.match.string
            );
        });

        it("should include retry count in telemetry when retrying", async () => {
            const mockError = new Error("Transient error");
            const mockResponse = { ok: true, status: 200 };
            const fetchStub = stub(fetch, "default");
            fetchStub.onFirstCall().rejects(mockError);
            fetchStub.onSecondCall().resolves(mockResponse as unknown as fetch.Response);

            const handler = new ConcurrencyHandler();
            await handler.handleRequest("https://test.com/api");

            const telemetryCall = sendInfoTelemetryStub.getCall(0);
            expect(telemetryCall.args[0]).to.equal(webExtensionTelemetryEventNames.WEB_EXTENSION_REQUEST_RETRY);
            expect(telemetryCall.args[1]).to.have.property("attempt", "1");
        });
    });
});
