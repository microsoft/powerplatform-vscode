/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { PacWrapper } from '../../../client/pac/PacWrapper';
import { SUCCESS } from '../../constants';
import { AUTH_CREATE_FAILED, AUTH_CREATE_MESSAGE } from '../../copilot/constants';
import { createAuthProfileExp } from '../PacAuthUtil';
import * as Utils from '../Utils';

describe('PacAuthUtils', () => {
    let sandbox: sinon.SinonSandbox;
    let showInputBoxStub: sinon.SinonStub;
    let showProgressStub: sinon.SinonStub;
    let showErrorMessageStub: sinon.SinonStub;
    let pacWrapperStub: sinon.SinonStubbedInstance<PacWrapper>;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        showInputBoxStub = sandbox.stub(Utils, 'showInputBoxAndGetOrgUrl');
        showProgressStub = sandbox.stub(Utils, 'showProgressWithNotification');
        showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage');
        pacWrapperStub = sandbox.createStubInstance(PacWrapper);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('createAuthProfileExp', () => {
        it('should return undefined when user cancels org URL input', async () => {
            showInputBoxStub.resolves(undefined);

            const result = await createAuthProfileExp(pacWrapperStub);

            expect(result).to.be.undefined;
            expect(showErrorMessageStub.called).to.be.false;
        });

        it('should show error when PacWrapper is undefined', async () => {
            showInputBoxStub.resolves('https://test.org');

            const result = await createAuthProfileExp(undefined);

            expect(result).to.be.undefined;
            expect(showErrorMessageStub.calledOnceWith(AUTH_CREATE_FAILED)).to.be.true;
        });

        it('should show error when auth profile creation fails', async () => {
            const orgUrl = 'https://test.org';
            showInputBoxStub.resolves(orgUrl);
            showProgressStub.resolves({ Status: 'Failed' });

            const result = await createAuthProfileExp(pacWrapperStub);

            expect(result).to.be.undefined;
            expect(showErrorMessageStub.calledOnceWith(AUTH_CREATE_FAILED)).to.be.true;
            expect(showProgressStub.calledOnce).to.be.true;
        });

        it('should successfully create auth profile', async () => {
            const orgUrl = 'https://test.org';
            const successResponse = { Status: SUCCESS };

            showInputBoxStub.resolves(orgUrl);
            showProgressStub.resolves(successResponse);

            const result = await createAuthProfileExp(pacWrapperStub);

            expect(result).to.deep.equal(successResponse);
            expect(showErrorMessageStub.called).to.be.false;
            expect(showProgressStub.calledOnce).to.be.true;
            expect(showProgressStub.firstCall.args[0]).to.equal(AUTH_CREATE_MESSAGE);
        });
    });
});
