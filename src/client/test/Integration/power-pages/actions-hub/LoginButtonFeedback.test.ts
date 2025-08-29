/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { createNewAuthProfile } from '../../../../power-pages/actions-hub/ActionsHubCommandHandlers';
import { PacWrapper } from '../../../../pac/PacWrapper';
import * as authProvider from '../../../../../common/services/AuthenticationProvider';
import * as PacAuthUtil from '../../../../../common/utilities/PacAuthUtil';
import PacContext from '../../../../pac/PacContext';

describe('Login Button User Feedback Tests', () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowInformationMessage: sinon.SinonStub;
    let mockShowErrorMessage: sinon.SinonStub;
    let mockPacWrapper: sinon.SinonStubbedInstance<PacWrapper>;
    let mockCreateAuthProfileExp: sinon.SinonStub;
    let mockAuthenticationInVsCode: sinon.SinonStub;
    let orgInfoStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
        mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');
        mockPacWrapper = sandbox.createStubInstance(PacWrapper);
        mockCreateAuthProfileExp = sandbox.stub(PacAuthUtil, 'createAuthProfileExp');
        mockAuthenticationInVsCode = sandbox.stub(authProvider, 'authenticateUserInVSCode');
        orgInfoStub = sandbox.stub(PacContext, 'OrgInfo').value({ OrgId: 'testOrgId', OrgUrl: '' });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should show success message when login is successful', async () => {
        // Arrange: Set up successful authentication scenario
        orgInfoStub.value({ OrgId: 'testOrgId', OrgUrl: 'https://test-org-url' });
        mockAuthenticationInVsCode.resolves();

        // Act: Call the login function
        await createNewAuthProfile(mockPacWrapper);

        // Assert: Verify success message is shown
        expect(mockShowInformationMessage.calledOnce).to.be.true;
        expect(mockShowErrorMessage.called).to.be.false;
    });

    it('should show error message when authentication fails', async () => {
        // Arrange: Set up authentication failure scenario
        const error = new Error('Authentication failed');
        mockAuthenticationInVsCode.rejects(error);
        orgInfoStub.value({ OrgId: 'testOrgId', OrgUrl: 'https://test-org-url' });

        // Act: Call the login function
        await createNewAuthProfile(mockPacWrapper);

        // Assert: Verify error message is shown
        expect(mockShowErrorMessage.calledOnce).to.be.true;
        expect(mockShowInformationMessage.called).to.be.false;
    });

    it('should show error message when organization URL is missing', async () => {
        // Arrange: Set up scenario with missing org URL
        const mockResults = [{ ActiveOrganization: { Item2: null } }];
        mockCreateAuthProfileExp.resolves({ Status: 'Success', Results: mockResults });

        // Act: Call the login function
        await createNewAuthProfile(mockPacWrapper);

        // Assert: Verify error message is shown
        expect(mockShowErrorMessage.calledOnce).to.be.true;
        expect(mockShowInformationMessage.called).to.be.false;
    });

    it('should provide user feedback for any authentication scenario', async () => {
        // Test success scenario
        orgInfoStub.value({ OrgId: 'testOrgId', OrgUrl: 'https://test-org-url' });
        mockAuthenticationInVsCode.resolves();

        await createNewAuthProfile(mockPacWrapper);

        // Verify user gets feedback
        const userGotFeedback = mockShowInformationMessage.called || mockShowErrorMessage.called;
        expect(userGotFeedback).to.be.true;

        // Reset for error scenario
        mockShowInformationMessage.reset();
        mockShowErrorMessage.reset();
        mockCreateAuthProfileExp.resolves({ Status: 'Failed', Results: null });

        await createNewAuthProfile(mockPacWrapper);

        // Verify user gets error feedback  
        expect(mockShowErrorMessage.called).to.be.true;
    });
});