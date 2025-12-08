/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { createNewAuthProfile } from '../../../../../power-pages/actions-hub/handlers/CreateNewAuthProfileHandler';
import { PacWrapper } from '../../../../../pac/PacWrapper';
import * as authProvider from '../../../../../../common/services/AuthenticationProvider';
import * as PacAuthUtil from '../../../../../../common/utilities/PacAuthUtil';
import PacContext from '../../../../../pac/PacContext';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

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
    });
});
