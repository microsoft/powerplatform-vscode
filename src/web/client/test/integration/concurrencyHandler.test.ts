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
            // Should log error telemetry for bulkhead rejection
            assert.calledOnce(sendErrorTelemetryStub);
            assert.calledWith(
                sendErrorTelemetryStub,
                webExtensionTelemetryEventNames.WEB_EXTENSION_BULKHEAD_QUEUE_FULL,
                "handleRequest",
                sinon.match.string
            );
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
});
