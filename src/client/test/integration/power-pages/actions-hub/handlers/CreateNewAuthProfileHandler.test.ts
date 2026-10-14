/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { createNewAuthProfile, syncAuthFromPacCli } from '../../../../../power-pages/actions-hub/handlers/CreateNewAuthProfileHandler';
import { PacWrapper } from '../../../../../pac/PacWrapper';
import * as authProvider from '../../../../../../common/services/AuthenticationProvider';
import * as PacAuthUtil from '../../../../../../common/utilities/PacAuthUtil';
import * as CommonUtility from '../../../../../power-pages/commonUtility';
import PacContext from '../../../../../pac/PacContext';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';
import { AuthInfo, CloudInstance, EnvironmentType, OrgInfo, PacAuthWhoOutput, PacOrgWhoOutput } from '../../../../../pac/PacTypes';

describe('CreateNewAuthProfileHandler', () => {
    let sandbox: sinon.SinonSandbox;
    let traceErrorStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(vscode.window, 'showInformationMessage');
        traceErrorStub = sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('createNewAuthProfile', () => {
        let mockPacWrapper: sinon.SinonStubbedInstance<PacWrapper>;
        let mockCreateAuthProfileExp: sinon.SinonStub;
        let mockAuthenticationInVsCode: sinon.SinonStub;
        let orgInfoStub: sinon.SinonStub;

        beforeEach(() => {
            mockPacWrapper = sandbox.createStubInstance(PacWrapper);
            mockCreateAuthProfileExp = sandbox.stub(PacAuthUtil, 'createAuthProfileExp');
            mockAuthenticationInVsCode = sandbox.stub(authProvider, 'authenticateUserInVSCode');
            orgInfoStub = sandbox.stub(PacContext, 'OrgInfo').value({ OrgId: 'testOrgId', OrgUrl: '' });
        });

        it('should only authenticate in VS Code when PAC auth output is successful', async () => {
            const mockResults = [{ ActiveOrganization: [null, null] }];
            mockCreateAuthProfileExp.resolves({ Status: 'Success', Results: mockResults });
            orgInfoStub.value({ OrgId: 'testOrgId', OrgUrl: 'https://test-org-url' });

            await createNewAuthProfile(mockPacWrapper);

            expect(mockCreateAuthProfileExp.calledOnce).to.be.false;
            expect(mockAuthenticationInVsCode.calledOnce).to.be.true;
        });

        it('should handle missing organization URL', async () => {
            const mockResults = [{ ActiveOrganization: [null, null] }];
            mockCreateAuthProfileExp.resolves({ Status: 'Success', Results: mockResults });

            await createNewAuthProfile(mockPacWrapper);

            expect(mockCreateAuthProfileExp.calledOnce).to.be.true;
            expect(mockAuthenticationInVsCode.called).to.be.false;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal('createNewAuthProfile');
        });

        it('should handle empty results array', async () => {
            mockCreateAuthProfileExp.resolves({ Status: 'Success', Results: [] });

            await createNewAuthProfile(mockPacWrapper);

            expect(mockCreateAuthProfileExp.calledOnce).to.be.true;
            expect(mockAuthenticationInVsCode.called).to.be.false;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal('createNewAuthProfile');
        });

        it('should handle PAC auth output failure', async () => {
            mockCreateAuthProfileExp.resolves({ Status: 'Failed', Results: null });

            await createNewAuthProfile(mockPacWrapper);

            expect(mockCreateAuthProfileExp.calledOnce).to.be.true;
            expect(mockAuthenticationInVsCode.called).to.be.false;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal('createNewAuthProfile');
        });

        it('should handle errors during auth profile creation', async () => {
            const error = new Error('Test error');
            mockCreateAuthProfileExp.rejects(error);

            await createNewAuthProfile(mockPacWrapper);

            expect(mockCreateAuthProfileExp.calledOnce).to.be.true;
            expect(mockAuthenticationInVsCode.called).to.be.false;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal('ActionsHubCreateAuthProfileFailed');
        });

        it('should sync auth from PAC CLI and authenticate in VS Code when PAC has active auth but PacContext is not populated', async () => {
            const mockAuthResults = [
                { Key: 'OrganizationFriendlyName', Value: 'Test Organization' },
                { Key: 'EntraIdObjectId', Value: 'test-object-id' }
            ];
            mockPacWrapper.activeAuth.resolves({ Status: 'Success', Results: mockAuthResults } as unknown as PacAuthWhoOutput);
            mockPacWrapper.activeOrg.resolves({
                Status: 'Success',
                Results: { OrgId: 'org-id', UniqueName: 'testorg', FriendlyName: 'Test Organization', OrgUrl: 'https://test.crm.dynamics.com', UserEmail: 'test@test.com', UserId: 'user-id', EnvironmentId: 'env-id' }
            } as unknown as PacOrgWhoOutput);
            sandbox.stub(CommonUtility, 'extractAuthInfo').returns({
                OrganizationFriendlyName: 'Test Organization',
                EntraIdObjectId: 'test-object-id'
            } as unknown as AuthInfo);
            sandbox.stub(CommonUtility, 'extractOrgInfo').returns({
                OrgId: 'org-id',
                OrgUrl: 'https://test.crm.dynamics.com'
            } as OrgInfo);
            const setContextStub = sandbox.stub(PacContext, 'setContext');

            await createNewAuthProfile(mockPacWrapper);

            expect(mockPacWrapper.activeAuth.calledOnce).to.be.true;
            expect(setContextStub.calledOnce).to.be.true;
            expect(mockAuthenticationInVsCode.calledOnce).to.be.true;
            expect(mockCreateAuthProfileExp.called).to.be.false;
        });

        it('should fall through to createAuthProfileExp when PAC CLI has no active auth', async () => {
            mockPacWrapper.activeAuth.resolves({ Status: 'Failed', Results: [] } as unknown as PacAuthWhoOutput);
            mockCreateAuthProfileExp.resolves({ Status: 'Failed', Results: null });

            await createNewAuthProfile(mockPacWrapper);

            expect(mockPacWrapper.activeAuth.calledOnce).to.be.true;
            expect(mockCreateAuthProfileExp.calledOnce).to.be.true;
        });

        it('should fall through to createAuthProfileExp when PAC CLI activeAuth throws', async () => {
            mockPacWrapper.activeAuth.rejects(new Error('PAC CLI error'));
            mockCreateAuthProfileExp.resolves({ Status: 'Failed', Results: null });

            await createNewAuthProfile(mockPacWrapper);

            expect(mockPacWrapper.activeAuth.calledOnce).to.be.true;
            expect(mockCreateAuthProfileExp.calledOnce).to.be.true;
        });
    });

    describe('syncAuthFromPacCli', () => {
        let mockPacWrapper: sinon.SinonStubbedInstance<PacWrapper>;

        beforeEach(() => {
            mockPacWrapper = sandbox.createStubInstance(PacWrapper);
        });

        it('should return true and set context when PAC CLI has valid auth with OrganizationFriendlyName', async () => {
            const mockAuthResults = [
                { Key: 'OrganizationFriendlyName', Value: 'Test Organization' }
            ];
            mockPacWrapper.activeAuth.resolves({ Status: 'Success', Results: mockAuthResults } as unknown as PacAuthWhoOutput);
            mockPacWrapper.activeOrg.resolves({
                Status: 'Success',
                Results: { OrgId: 'org-id', UniqueName: 'testorg', FriendlyName: 'Test Org', OrgUrl: 'https://test.crm.dynamics.com', UserEmail: 'test@test.com', UserId: 'user-id', EnvironmentId: 'env-id' }
            } as unknown as PacOrgWhoOutput);
            sandbox.stub(CommonUtility, 'extractAuthInfo').returns({
                OrganizationFriendlyName: 'Test Organization'
            } as unknown as AuthInfo);
            sandbox.stub(CommonUtility, 'extractOrgInfo').returns({
                OrgId: 'org-id', OrgUrl: 'https://test.crm.dynamics.com'
            } as OrgInfo);
            const setContextStub = sandbox.stub(PacContext, 'setContext');

            const result = await syncAuthFromPacCli(mockPacWrapper);

            expect(result).to.be.true;
            expect(setContextStub.calledOnce).to.be.true;
        });

        it('should return false when PAC CLI has no active auth', async () => {
            mockPacWrapper.activeAuth.resolves({ Status: 'Failed', Results: [] } as unknown as PacAuthWhoOutput);

            const result = await syncAuthFromPacCli(mockPacWrapper);

            expect(result).to.be.false;
        });

        it('should return false when PAC CLI auth has empty OrganizationFriendlyName', async () => {
            const mockAuthResults = [
                { Key: 'OrganizationFriendlyName', Value: '' }
            ];
            mockPacWrapper.activeAuth.resolves({ Status: 'Success', Results: mockAuthResults } as unknown as PacAuthWhoOutput);
            sandbox.stub(CommonUtility, 'extractAuthInfo').returns({
                OrganizationFriendlyName: ''
            } as unknown as AuthInfo);

            const result = await syncAuthFromPacCli(mockPacWrapper);

            expect(result).to.be.false;
        });

        it('should return false when PAC CLI activeAuth throws', async () => {
            mockPacWrapper.activeAuth.rejects(new Error('PAC CLI error'));

            const result = await syncAuthFromPacCli(mockPacWrapper);

            expect(result).to.be.false;
        });

        it('should still succeed when activeOrg fails', async () => {
            const mockAuthResults = [
                { Key: 'OrganizationFriendlyName', Value: 'Test Organization' }
            ];
            mockPacWrapper.activeAuth.resolves({ Status: 'Success', Results: mockAuthResults } as unknown as PacAuthWhoOutput);
            mockPacWrapper.activeOrg.rejects(new Error('Org fetch failed'));
            sandbox.stub(CommonUtility, 'extractAuthInfo').returns({
                OrganizationFriendlyName: 'Test Organization'
            } as unknown as AuthInfo);
            const setContextStub = sandbox.stub(PacContext, 'setContext');

            const result = await syncAuthFromPacCli(mockPacWrapper);

            expect(result).to.be.true;
            expect(setContextStub.calledOnce).to.be.true;
            // Should be called with authInfo and null orgInfo
            expect(setContextStub.firstCall.args[1]).to.be.null;
        });
    });
});
