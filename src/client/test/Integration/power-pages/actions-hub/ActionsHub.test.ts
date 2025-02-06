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
import { EnableActionsHub } from "../../../../../common/ecs-features/ecsFeatureGates";

describe('ActionsHub', () => {
    let context: vscode.ExtensionContext;
    let pacTerminal: PacTerminal;
    let loggerStub: sinon.SinonStub;
    let ecsFeaturesClientStub: sinon.SinonStub;
    let executeCommandStub: sinon.SinonStub;

    beforeEach(() => {
        context = {} as vscode.ExtensionContext;
        pacTerminal = {} as PacTerminal;
<<<<<<< HEAD
        loggerStub = sinon.stub(oneDSLoggerWrapper, 'getLogger').returns({
            traceInfo: sinon.stub(),
            traceWarning: sinon.stub(),
            traceError: sinon.stub(),
            featureUsage: sinon.stub()
        });
=======
        loggerStub = sinon.stub(oneDSLoggerWrapper.getLogger(), 'traceInfo');
>>>>>>> fe78e41e3d27cfd7c71d7206ed90380e9d62c40d
        ecsFeaturesClientStub = sinon.stub(ECSFeaturesClient, 'getConfig');
        executeCommandStub = sinon.stub(vscode.commands, 'executeCommand');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('isEnabled', () => {
        it('should return false if enableActionsHub is undefined', () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).returns({ enableActionsHub: undefined });

            const result = ActionsHub.isEnabled();

            expect(result).to.be.false;
        });

        it('should return true if enableActionsHub is true', () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).returns({ enableActionsHub: true });

            const result = ActionsHub.isEnabled();

            expect(result).to.be.true;
        });

        it('should return false if enableActionsHub is false', () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).returns({ enableActionsHub: false });

            const result = ActionsHub.isEnabled();

            expect(result).to.be.false;
        });
    });

    describe('initialize', () => {
        it('should log telemetry and set context when ActionsHub is enabled', async () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).returns({ enableActionsHub: true });
            const actionsHubTreeDataProviderStub = sinon.stub(ActionsHubTreeDataProvider, 'initialize');

            await ActionsHub.initialize(context, pacTerminal);

            expect(loggerStub.calledOnceWithExactly("EnableActionsHub", { isEnabled: 'true' })).to.be.true;
            expect(executeCommandStub.calledOnceWithExactly("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", true)).to.be.true;
            expect(actionsHubTreeDataProviderStub.calledOnceWithExactly(context, pacTerminal)).to.be.true;
        });

        it('should log telemetry and set context when ActionsHub is disabled', async () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).returns({ enableActionsHub: false });

            await ActionsHub.initialize(context, pacTerminal);

            expect(loggerStub.calledOnceWithExactly("EnableActionsHub", { isEnabled: 'false' })).to.be.true;
            expect(executeCommandStub.calledOnceWithExactly("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", false)).to.be.true;
        });
    });
});
