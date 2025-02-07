/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { ActionsHub } from '../../../../power-pages/actions-hub/ActionsHub';
import { ECSFeaturesClient } from '../../../../../common/ecs-features/ecsFeatureClient';
import { EnableActionsHub } from '../../../../../common/ecs-features/ecsFeatureGates';
import { ActionsHubTreeDataProvider } from '../../../../power-pages/actions-hub/ActionsHubTreeDataProvider';
import { oneDSLoggerWrapper } from '../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { PacTerminal } from '../../../../lib/PacTerminal';

describe('ActionsHub', () => {
    let context: vscode.ExtensionContext;
    let pacTerminal: PacTerminal;
    let loggerStub: sinon.SinonStubbedInstance<any>;
    let ecsFeaturesClientStub: sinon.SinonStub;
    let executeCommandStub: sinon.SinonStub;

    beforeEach(() => {
        context = {} as vscode.ExtensionContext;
        pacTerminal = {} as PacTerminal;
        loggerStub = sinon.createStubInstance(oneDSLoggerWrapper, {
            traceInfo: sinon.stub(),
            traceWarning: sinon.stub(),
            traceError: sinon.stub(),
            featureUsage: sinon.stub()
        });
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

        it('should handle exceptions and return false', () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).throws(new Error('Test Error'));

            const result = ActionsHub.isEnabled();

            expect(result).to.be.false;
        });
    });

    describe('initialize', () => {
        it('should log telemetry and set context when ActionsHub is enabled', async () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).returns({ enableActionsHub: true });
            const actionsHubTreeDataProviderStub = sinon.stub(ActionsHubTreeDataProvider, 'initialize');

            await ActionsHub.initialize(context, pacTerminal);

            expect(loggerStub.traceInfo.calledOnceWithExactly("EnableActionsHub", { isEnabled: 'true' })).to.be.true;
            expect(executeCommandStub.calledOnceWithExactly("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", true)).to.be.true;
            expect(actionsHubTreeDataProviderStub.calledOnceWithExactly(context, pacTerminal)).to.be.true;

            actionsHubTreeDataProviderStub.restore();
        });

        it('should log telemetry and set context when ActionsHub is disabled', async () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).returns({ enableActionsHub: false });

            await ActionsHub.initialize(context, pacTerminal);

            expect(loggerStub.traceInfo.calledOnceWithExactly("EnableActionsHub", { isEnabled: 'false' })).to.be.true;
            expect(executeCommandStub.calledOnceWithExactly("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", false)).to.be.true;
        });

        it('should handle exceptions and log error telemetry', async () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).throws(new Error('Test Error'));

            await ActionsHub.initialize(context, pacTerminal);

            expect(loggerStub.traceError.calledOnce).to.be.true;
        });

        it('should not initialize ActionsHubTreeDataProvider if ActionsHub is disabled', async () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).returns({ enableActionsHub: false });
            const actionsHubTreeDataProviderStub = sinon.stub(ActionsHubTreeDataProvider, 'initialize');

            await ActionsHub.initialize(context, pacTerminal);

            expect(actionsHubTreeDataProviderStub.notCalled).to.be.true;

            actionsHubTreeDataProviderStub.restore();
        });

        it('should initialize ActionsHubTreeDataProvider if ActionsHub is enabled', async () => {
            ecsFeaturesClientStub.withArgs(EnableActionsHub).returns({ enableActionsHub: true });
            const actionsHubTreeDataProviderStub = sinon.stub(ActionsHubTreeDataProvider, 'initialize');

            await ActionsHub.initialize(context, pacTerminal);

            expect(actionsHubTreeDataProviderStub.calledOnceWithExactly(context, pacTerminal)).to.be.true;

            actionsHubTreeDataProviderStub.restore();
        });
    });
});
