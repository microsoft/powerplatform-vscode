/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { pacAuthManager } from "../../../../pac/PacAuthManager";
import { showEnvironmentDetails, refreshEnvironment } from '../../../../power-pages/actions-hub/ActionsHubCommandHandlers';
import { Constants } from '../../../../power-pages/actions-hub/Constants';
import { oneDSLoggerWrapper } from '../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import * as CommonUtils from '../../../../power-pages/commonUtility';
import { AuthInfo } from '../../../../pac/PacTypes';

describe('ActionsHubCommandHandlers', () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowInformationMessage: sinon.SinonStub;
    let mockSetAuthInfo: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;

    const mockAuthInfo = {
        tenantId: 'test-tenant',
        entraIdObjectId: 'test-object-id',
        organizationId: 'test-org-id',
        organizationUniqueName: 'test-org-name',
        environmentId: 'test-env-id',
        environmentType: 'test-env-type',
        cloud: 'test-cloud',
        environmentGeo: 'test-geo'
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
        mockSetAuthInfo = sandbox.stub(pacAuthManager, 'setAuthInfo');
        traceErrorStub = sinon.stub();
        sandbox.stub(oneDSLoggerWrapper, 'getLogger').returns({
            traceError: traceErrorStub,
            traceInfo: sinon.stub(),
            traceWarning: sinon.stub(),
            featureUsage: sinon.stub(),
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('showEnvironmentDetails', () => {
        let mockGetAuthInfo: sinon.SinonStub;

        beforeEach(() => {
            mockGetAuthInfo = sandbox.stub(pacAuthManager, 'getAuthInfo');
        });

        it('should show environment details when auth info is available', async () => {
            mockGetAuthInfo.returns(mockAuthInfo);
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showEnvironmentDetails();

            expect(mockShowInformationMessage.calledOnce).to.be.true;
            expect(mockShowInformationMessage.firstCall.args[0]).to.include("Session Details");
            expect(mockShowInformationMessage.firstCall.args[0]).to.include("Timestamp");
            expect(mockShowInformationMessage.firstCall.args[0]).to.include("Tenant ID: test-tenant");
            expect(mockShowInformationMessage.firstCall.args[0]).to.include("Object ID: test-object-id");
            expect(mockShowInformationMessage.firstCall.args[0]).to.include("Organization ID: test-org-id");
            expect(mockShowInformationMessage.firstCall.args[0]).to.include("Unique name: test-org-name");
            expect(mockShowInformationMessage.firstCall.args[0]).to.include("Environment ID: test-env-id");
            expect(mockShowInformationMessage.firstCall.args[0]).to.include("Cluster environment: test-env-type");
            expect(mockShowInformationMessage.firstCall.args[0]).to.include("Cluster category: test-cloud");
            expect(mockShowInformationMessage.firstCall.args[0]).to.include("Cluster geo name: test-geo");
        });

        it('should handle cases without auth info', async () => {
            mockGetAuthInfo.returns(undefined);
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showEnvironmentDetails();

            expect(mockShowInformationMessage.calledOnce).to.be.true;
        });

        it('should handle errors appropriately', async () => {
            mockGetAuthInfo.throws(new Error('Test error'));

            await showEnvironmentDetails();

            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_FAILED);
        });
    });

    describe('refreshEnvironment', () => {
        let mockPacTerminal: { getWrapper: sinon.SinonStub };
        let mockActiveAuth: sinon.SinonStub;
        let mockExtractAuthInfo: sinon.SinonStub;

        beforeEach(() => {
            mockPacTerminal = {
                getWrapper: sandbox.stub()
            };
            mockActiveAuth = sandbox.stub();
            mockPacTerminal.getWrapper.returns({ activeAuth: mockActiveAuth });
            mockExtractAuthInfo = sandbox.stub(CommonUtils, 'extractAuthInfo').returns(mockAuthInfo as unknown as AuthInfo);
        });

        it('should refresh environment successfully when auth is available', async () => {
            const mockResults = {
                tenantId: 'test-tenant',
                userId: 'test-user'
            };
            mockActiveAuth.resolves({
                Status: 'Success',
                Results: mockResults
            });

            await refreshEnvironment(mockPacTerminal as any);

            expect(mockActiveAuth.calledOnce).to.be.true;
            expect(mockSetAuthInfo.calledOnce).to.be.true;
            expect(mockExtractAuthInfo.calledOnce).to.be.true;
            expect(mockSetAuthInfo.firstCall.args[0]).to.deep.equal(mockAuthInfo);
        });

        it('should not set auth info when activeAuth status is not success', async () => {
            mockActiveAuth.resolves({
                Status: 'Failed',
                Results: null
            });

            await refreshEnvironment(mockPacTerminal as any);

            expect(mockActiveAuth.calledOnce).to.be.true;
            expect(mockSetAuthInfo.called).to.be.false;
            expect(mockExtractAuthInfo.called).to.be.false;
        });

        it('should handle error when activeAuth fails', async () => {
            const error = new Error('Active auth failed');
            mockActiveAuth.rejects(error);

            await refreshEnvironment(mockPacTerminal as any);

            expect(traceErrorStub.firstCall.args[3]).to.deep.equal({ methodName: 'refreshEnvironment' });
        });
    });
});
