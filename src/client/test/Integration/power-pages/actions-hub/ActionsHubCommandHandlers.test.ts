/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { showEnvironmentDetails, refreshEnvironment, switchEnvironment } from '../../../../power-pages/actions-hub/ActionsHubCommandHandlers';
import { Constants } from '../../../../power-pages/actions-hub/Constants';
import { oneDSLoggerWrapper } from '../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import * as CommonUtils from '../../../../power-pages/commonUtility';
import { AuthInfo, CloudInstance, EnvironmentType, OrgInfo } from '../../../../pac/PacTypes';
import { PacTerminal } from '../../../../lib/PacTerminal';
import PacContext from '../../../../pac/PacContext';

describe('ActionsHubCommandHandlers', () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowInformationMessage: sinon.SinonStub;
    let mockSetAuthInfo: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;

    const mockAuthInfo : AuthInfo = {
        UserType: 'user-type',
        Cloud: CloudInstance.Preprod,
        TenantId: 'test-tenant',
        TenantCountry: 'tenant-country',
        User: 'user',
        EntraIdObjectId: 'test-object-id',
        Puid: 'test-puid',
        UserCountryRegion: 'user-country-region',
        TokenExpires: 'token-expires',
        Authority: 'authority',
        EnvironmentGeo: 'test-geo',
        EnvironmentId: 'test-env-id',
        EnvironmentType: EnvironmentType.Regular,
        OrganizationId: 'test-org-id',
        OrganizationUniqueName: 'test-org-name',
        OrganizationFriendlyName: 'test-org-friendly-name'
    };

    const mockOrgInfo: OrgInfo = {
        OrgId: 'test-org-id',
        UniqueName: 'test-org-name',
        FriendlyName: 'test-org-friendly-name',
        OrgUrl: 'test-org-url',
        UserEmail: 'test-user-email',
        UserId: 'test-user-id',
        EnvironmentId: 'test-env-id',
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
        mockSetAuthInfo = sandbox.stub(PacContext, 'setContext');
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
        it('should show environment details when auth info is available', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            PacContext['_orgInfo'] = mockOrgInfo;
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showEnvironmentDetails();

            expect(mockShowInformationMessage.calledOnce).to.be.true;

            const message = mockShowInformationMessage.firstCall.args[0];
            console.log(message)

            expect(message).to.include("Session Details");
            expect(message).to.include("Timestamp");
            expect(message).to.include("Tenant ID: test-tenant");
            expect(message).to.include("Object ID: test-object-id");
            expect(message).to.include("Organization ID: test-org-id");
            expect(message).to.include("Unique name: test-org-name");
            expect(message).to.include("Instance url: test-org-url");
            expect(message).to.include("Environment ID: test-env-id");
            expect(message).to.include("Cluster environment: 1");
            expect(message).to.include("Cluster category: 1");
            expect(message).to.include("Cluster geo name: test-geo");
        });

        it('should handle cases without auth info', async () => {
            PacContext['_authInfo'] = null;
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showEnvironmentDetails();

            expect(mockShowInformationMessage.calledOnce).to.be.true;
        });

        it('should handle errors appropriately', async () => {
            mockShowInformationMessage.throws(new Error('Test error'));

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
            PacContext['_authInfo'] = mockAuthInfo;
            const mockResults = {
                tenantId: 'test-tenant',
                userId: 'test-user'
            };
            mockActiveAuth.resolves({
                Status: 'Success',
                Results: mockResults
            });

            await refreshEnvironment(mockPacTerminal as unknown as PacTerminal);

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

            await refreshEnvironment(mockPacTerminal as unknown as PacTerminal);

            expect(mockActiveAuth.calledOnce).to.be.true;
            expect(mockSetAuthInfo.called).to.be.false;
            expect(mockExtractAuthInfo.called).to.be.false;
        });

        it('should handle error when activeAuth fails', async () => {
            const error = new Error('Active auth failed');
            mockActiveAuth.rejects(error);

            await refreshEnvironment(mockPacTerminal as unknown as PacTerminal);

            expect(traceErrorStub.firstCall.args[3]).to.deep.equal({ methodName: 'refreshEnvironment' });
        });
    });

    describe('switchEnvironment', () => {
        let mockPacTerminal: { getWrapper: sinon.SinonStub };
        let mockOrgList: sinon.SinonStub;
        let mockOrgSelect: sinon.SinonStub;
        let mockShowQuickPick: sinon.SinonStub;

        const mockEnvList = [
            {
                FriendlyName: 'Dev Environment',
                EnvironmentUrl: 'https://dev.crm.dynamics.com'
            },
            {
                FriendlyName: 'Prod Environment',
                EnvironmentUrl: 'https://prod.crm.dynamics.com'
            }
        ];

        beforeEach(() => {
            mockPacTerminal = {
                getWrapper: sandbox.stub()
            };
            mockOrgList = sandbox.stub();
            mockOrgSelect = sandbox.stub();
            mockPacTerminal.getWrapper.returns({
                orgList: mockOrgList,
                orgSelect: mockOrgSelect
            });
            mockShowQuickPick = sandbox.stub(vscode.window, 'showQuickPick');
        });

        it('should switch environment successfully when env is selected', async () => {
            mockOrgList.resolves({
                Status: 'Success',
                Results: mockEnvList
            });
            mockShowQuickPick.resolves({
                label: 'Dev Environment',
                description: 'https://dev.crm.dynamics.com'
            });
            mockOrgSelect.resolves();

            await switchEnvironment(mockPacTerminal as unknown as PacTerminal);

            expect(mockOrgList.calledOnce).to.be.true;
            expect(mockShowQuickPick.calledOnce).to.be.true;
        });
    });
});
