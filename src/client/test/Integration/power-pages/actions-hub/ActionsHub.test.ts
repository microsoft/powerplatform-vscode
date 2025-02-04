/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import * as CommonUtils from "../../../../power-pages/commonUtility";
import { ActionsHub } from "../../../../power-pages/actions-hub/ActionsHub";
import { PacTerminal } from "../../../../lib/PacTerminal";
import { ECSFeaturesClient } from "../../../../../common/ecs-features/ecsFeatureClient";
import { oneDSLoggerWrapper } from "../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { ActionsHubTreeDataProvider } from "../../../../power-pages/actions-hub/ActionsHubTreeDataProvider";
import { SUCCESS } from "../../../../../common/constants";
import { AUTH_KEYS } from "../../../../../common/OneDSLoggerTelemetry/telemetryConstants";
import { PacWrapper } from "../../../../pac/PacWrapper";
import { AuthInfo, PacAuthWhoOutput } from "../../../../pac/PacTypes";
import { pacAuthManager } from "../../../../pac/PacAuthManager";

describe("ActionsHub", () => {
    let getConfigStub: sinon.SinonStub;
    let executeCommandStub: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;
    let fakeContext: vscode.ExtensionContext;
    let fakePacWrapper: sinon.SinonStubbedInstance<PacWrapper>;
    let fakePacTerminal: sinon.SinonStubbedInstance<PacTerminal>;

    beforeEach(() => {
        getConfigStub = sinon.stub(ECSFeaturesClient, "getConfig");
        fakeContext = {} as vscode.ExtensionContext;
        fakePacWrapper = sinon.createStubInstance(PacWrapper, { activeAuth: sinon.stub() });
        fakePacTerminal = sinon.createStubInstance(PacTerminal, { getWrapper: fakePacWrapper });
        executeCommandStub = sinon.stub(vscode.commands, "executeCommand");
        traceInfoStub = sinon.stub();
        sinon.stub(oneDSLoggerWrapper, "getLogger").returns({
            traceInfo: traceInfoStub,
            traceWarning: sinon.stub(),
            traceError: sinon.stub(),
            featureUsage: sinon.stub()
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("isEnabled", () => {
        it("should return false if enableActionsHub is undefined", () => {
            getConfigStub.returns({ enableActionsHub: undefined });
            const result = ActionsHub.isEnabled();
            expect(result).to.be.false;
        });

        it("should return the actual boolean if enableActionsHub has a value", () => {
            getConfigStub.returns({ enableActionsHub: true });
            let result = ActionsHub.isEnabled();
            expect(result).to.be.true;

            getConfigStub.returns({ enableActionsHub: false });
            result = ActionsHub.isEnabled();
            expect(result).to.be.false;
        });
    });

    describe("initialize", () => {
        describe("when ActionsHub is enabled", () => {
            it("should set context to true and return early if isEnabled returns true", async () => {
                getConfigStub.returns({ enableActionsHub: true });
                await ActionsHub.initialize(fakeContext, fakePacTerminal);
                expect(traceInfoStub.calledWith("EnableActionsHub", { isEnabled: "true" })).to.be.true;
                expect(executeCommandStub.calledWith("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", true)).to.be.true;
            });

            it("should set Auth Info", async () => {
                getConfigStub.returns({ enableActionsHub: true });
                const data = { organizationFriendlyName: 'Foo' } as AuthInfo;
                sinon.stub(CommonUtils, 'extractAuthInfo').returns(data);
                const pacAuthSetInfoStub = sinon.stub(pacAuthManager, 'setAuthInfo');
                fakePacWrapper.activeAuth.returns(Promise.resolve({ Status: SUCCESS, Results: [{ Key: AUTH_KEYS.ORGANIZATION_FRIENDLY_NAME, Value: 'Foo' }] }) as Promise<PacAuthWhoOutput>);

                await ActionsHub.initialize(fakeContext, fakePacTerminal);
                expect(pacAuthSetInfoStub.calledWith(data)).to.be.true;
            });

            it("should initialize ActionsHubTreeDataProvider", async () => {
                getConfigStub.returns({ enableActionsHub: true });
                const actionsHubTreeDataProviderStub = sinon.stub(ActionsHubTreeDataProvider, 'initialize');
                fakePacWrapper.activeAuth.returns(Promise.resolve({ Status: SUCCESS, Results: [{ Key: AUTH_KEYS.ORGANIZATION_FRIENDLY_NAME, Value: 'Foo' }] }) as Promise<PacAuthWhoOutput>);

                await ActionsHub.initialize(fakeContext, fakePacTerminal);
                expect(actionsHubTreeDataProviderStub.calledWith(fakeContext)).to.be.true;
            });
        });

        describe("when ActionsHub is disabled", () => {
            it("should set context to false and return early if isEnabled returns false", () => {
                getConfigStub.returns({ enableActionsHub: false });
                ActionsHub.initialize(fakeContext, fakePacTerminal);
                expect(traceInfoStub.calledWith("EnableActionsHub", { isEnabled: "false" })).to.be.true;
                expect(executeCommandStub.calledWith("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", false)).to.be.true;
            });

            it("should not initialize ActionsHubTreeDataProvider", () => {
                getConfigStub.returns({ enableActionsHub: false });
                const actionsHubTreeDataProviderStub = sinon.stub(ActionsHubTreeDataProvider, 'initialize');
                ActionsHub.initialize(fakeContext, fakePacTerminal);
                expect(actionsHubTreeDataProviderStub.called).to.be.false;
            });
        });
    });
});
