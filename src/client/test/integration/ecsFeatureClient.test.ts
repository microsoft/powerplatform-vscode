/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { ECSConfigFailedInit, ECSConfigSuccessfulInit } from "../../../common/ecs-features/ecsTelemetryConstants";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { ECSAPIFeatureFlagFilters } from "../../../common/ecs-features/ecsFeatureFlagFilters";

describe("ECSFeaturesClient", () => {
    let sandbox: sinon.SinonSandbox;
    let fetchStub: sinon.SinonStub;
    let mockLogger: {
        traceError: sinon.SinonStub;
        traceInfo: sinon.SinonStub;
        traceWarning: sinon.SinonStub;
        featureUsage: sinon.SinonStub;
    };

    const mockFilters: ECSAPIFeatureFlagFilters = {
        AppName: "test-app",
        EnvID: "env-id",
        UserID: "user-id",
        TenantID: "tenant-id",
        Region: "test",
        Location: "NCH"
    };

    const clientName = "testClient";

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        fetchStub = sandbox.stub(global, "fetch");

        mockLogger = {
            traceError: sandbox.stub(),
            traceInfo: sandbox.stub(),
            traceWarning: sandbox.stub(),
            featureUsage: sandbox.stub()
        };
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns(mockLogger);

        // Reset internal state
        ECSFeaturesClient["_ecsConfig"] = undefined as unknown as Record<string, string | boolean>;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("init", () => {
        it("should initialize config on successful response", async () => {
            const mockConfig = { featureA: true, featureB: "value" };
            fetchStub.resolves({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ [clientName]: mockConfig })
            } as unknown as Response);

            await ECSFeaturesClient.init(mockFilters, clientName, true);

            expect(mockLogger.traceInfo.calledOnce).to.be.true;
            expect(mockLogger.traceInfo.firstCall.args[0]).to.equal(ECSConfigSuccessfulInit);
            expect(mockLogger.traceError.called).to.be.false;
        });

        it("should log error with HTTP status when response is not ok", async () => {
            fetchStub.resolves({
                ok: false,
                status: 503,
                statusText: "Service Unavailable"
            } as Response);

            await ECSFeaturesClient.init(mockFilters, clientName, true);

            expect(mockLogger.traceError.calledOnce).to.be.true;
            const [eventName, message, , eventInfo] = mockLogger.traceError.firstCall.args;
            expect(eventName).to.equal(ECSConfigFailedInit);
            expect(message).to.include("503");
            expect(message).to.include("Service Unavailable");
            expect(eventInfo).to.deep.equal({ clientName });
        });

        it("should log error when JSON parsing fails", async () => {
            fetchStub.resolves({
                ok: true,
                status: 200,
                json: () => Promise.reject(new TypeError("invalid json"))
            } as unknown as Response);

            await ECSFeaturesClient.init(mockFilters, clientName, true);

            expect(mockLogger.traceError.calledOnce).to.be.true;
            const [eventName, message, , eventInfo] = mockLogger.traceError.firstCall.args;
            expect(eventName).to.equal(ECSConfigFailedInit);
            expect(message).to.include("JSON parse failed");
            expect(message).to.include("200");
            expect(eventInfo).to.deep.equal({ clientName });
        });

        it("should log error when client config is missing from response", async () => {
            fetchStub.resolves({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ otherClient: { flag: true } })
            } as unknown as Response);

            await ECSFeaturesClient.init(mockFilters, clientName, true);

            expect(mockLogger.traceError.calledOnce).to.be.true;
            const [eventName, message] = mockLogger.traceError.firstCall.args;
            expect(eventName).to.equal(ECSConfigFailedInit);
            expect(message).to.include("Config not found");
            expect(message).to.include(clientName);
        });

        it("should pass clientName in eventInfo on error", async () => {
            fetchStub.resolves({
                ok: false,
                status: 500,
                statusText: "Internal Server Error"
            } as Response);

            await ECSFeaturesClient.init(mockFilters, clientName, true);

            const [, , , eventInfo] = mockLogger.traceError.firstCall.args;
            expect(eventInfo).to.deep.equal({ clientName });
        });

        it("should handle non-Error exceptions safely", async () => {
            fetchStub.rejects("string error");

            await ECSFeaturesClient.init(mockFilters, clientName, true);

            expect(mockLogger.traceError.calledOnce).to.be.true;
            const [, , error] = mockLogger.traceError.firstCall.args;
            expect(error).to.be.instanceOf(Error);
        });
    });
});
