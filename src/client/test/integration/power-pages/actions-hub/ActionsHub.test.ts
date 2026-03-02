/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { ActionsHub } from "../../../../power-pages/actions-hub/ActionsHub";
import { PacTerminal } from "../../../../lib/PacTerminal";
import { ECSFeaturesClient } from "../../../../../common/ecs-features/ecsFeatureClient";
import { oneDSLoggerWrapper } from "../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { ActionsHubTreeDataProvider } from "../../../../power-pages/actions-hub/ActionsHubTreeDataProvider";
import { PacWrapper } from "../../../../pac/PacWrapper";
import { Constants } from "../../../../power-pages/actions-hub/Constants";
import * as TelemetryHelper from "../../../../power-pages/actions-hub/TelemetryHelper";

describe("ActionsHub", () => {
    let getConfigStub: sinon.SinonStub;
    let executeCommandStub: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
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
        traceErrorStub = sinon.stub();
        sinon.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sinon.stub(oneDSLoggerWrapper, "getLogger").returns({
            traceInfo: traceInfoStub,
            traceWarning: sinon.stub(),
            traceError: traceErrorStub,
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
            expect(result).to.be.true;
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
        describe("when already initialized", () => {
            beforeEach(() => {
                ActionsHub["_isInitialized"] = true;
            });

            it("should return early", async () => {
                await ActionsHub.initialize(fakeContext, fakePacTerminal);
                expect(executeCommandStub.called).to.be.false;
            });
        });

        describe("when not already initialized", () => {
            beforeEach(() => {
                ActionsHub["_isInitialized"] = false;
            });

            describe("when ActionsHub is enabled", () => {
                let actionsHubTreeDataProviderStub: sinon.SinonStub;

                beforeEach(() => {
                    getConfigStub.returns({ enableActionsHub: true });
                    actionsHubTreeDataProviderStub = sinon.stub(ActionsHubTreeDataProvider, 'initialize');
                });

                it("should set context to true and return early if isEnabled returns true", async () => {
                    await ActionsHub.initialize(fakeContext, fakePacTerminal);
                    expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_ENABLED, { foo: 'bar', isEnabled: "true" })).to.be.true;
                    expect(executeCommandStub.calledWith("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", true)).to.be.true;
                });

                it("should initialize ActionsHubTreeDataProvider", async () => {
                    await ActionsHub.initialize(fakeContext, fakePacTerminal);
                    expect(actionsHubTreeDataProviderStub.calledWith(fakeContext)).to.be.true;

                    actionsHubTreeDataProviderStub.restore();
                });

                it("should initialize and log initialization event", async () => {
                    await ActionsHub.initialize(fakeContext, fakePacTerminal);

                    expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_INITIALIZED)).to.be.true;
                });

                it("should log error if an exception is thrown during initialization", async () => {
                    const fakeError = new Error("fake error");
                    actionsHubTreeDataProviderStub.throws(fakeError);

                    await ActionsHub.initialize(fakeContext, fakePacTerminal);

                    expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_INITIALIZATION_FAILED, fakeError.message, fakeError)).to.be.true;
                });
            });

            describe("when ActionsHub is disabled", () => {
                let actionsHubTreeDataProviderStub: sinon.SinonStub;

                beforeEach(() => {
                    getConfigStub.returns({ enableActionsHub: false });
                    actionsHubTreeDataProviderStub = sinon.stub(ActionsHubTreeDataProvider, 'initialize');
                });

                it("should set context to false and return early if isEnabled returns false", async () => {
                    await ActionsHub.initialize(fakeContext, fakePacTerminal);

                    expect(traceInfoStub.calledOnce).to.be.true;
                    expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_ENABLED);
                    expect(traceInfoStub.firstCall.args[1]).to.deep.equal({ foo: 'bar', isEnabled: "false" });
                    expect(executeCommandStub.calledWith("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", false)).to.be.true;
                });

                it("should not initialize ActionsHubTreeDataProvider", async () => {
                    await ActionsHub.initialize(fakeContext, fakePacTerminal);
                    expect(actionsHubTreeDataProviderStub.called).to.be.false;
                });
            });
        });
    });
});
