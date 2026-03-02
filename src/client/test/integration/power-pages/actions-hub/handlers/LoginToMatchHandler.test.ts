/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { loginToMatch } from '../../../../../power-pages/actions-hub/handlers/LoginToMatchHandler';
import { Constants } from '../../../../../power-pages/actions-hub/Constants';
import { ServiceEndpointCategory } from '../../../../../../common/services/Constants';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('LoginToMatchHandler', () => {
    let sandbox: sinon.SinonSandbox;
    let traceErrorStub: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(vscode.window, 'showInformationMessage');
        traceErrorStub = sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        traceInfoStub = sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('loginToMatch', () => {
        let mockGetSession: sinon.SinonStub;
        let mockShowErrorMessage: sinon.SinonStub;

        beforeEach(() => {
            mockGetSession = sandbox.stub(vscode.authentication, 'getSession');
            mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');
        });

        it('should successfully authenticate with matching account', async () => {
            const mockSession = {
                accessToken: 'valid-token',
                account: { id: 'test-account', label: 'test@example.com' },
                id: 'session-id',
                scopes: []
            } as vscode.AuthenticationSession;

            mockGetSession.resolves(mockSession);

            await loginToMatch(ServiceEndpointCategory.TEST);

            expect(mockGetSession.calledWith(
                'microsoft',
                ['https://api.test.powerplatform.com/.default'],
                { forceNewSession: true, clearSessionPreference: true }
            )).to.be.true;

            // Should call both login prompt clicked and login to match called events
            expect(traceInfoStub.calledWith(
                Constants.EventNames.ACTIONS_HUB_LOGIN_PROMPT_CLICKED
            )).to.be.true;
            expect(traceInfoStub.calledWith(
                Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_CALLED
            )).to.be.true;
            expect(traceInfoStub.calledWith(
                Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_SUCCEEDED
            )).to.be.true;
        });

        it('should handle authentication cancellation gracefully', async () => {
            mockGetSession.resolves(undefined); // User cancelled authentication

            await loginToMatch(ServiceEndpointCategory.PROD);

            expect(mockGetSession.calledOnce).to.be.true;
            expect(mockShowErrorMessage.called).to.be.false; // Should not show error for cancellation
            expect(traceInfoStub.calledWith(
                Constants.EventNames.ACTIONS_HUB_LOGIN_PROMPT_CLICKED
            )).to.be.true;
            expect(traceInfoStub.calledWith(
                Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_CALLED
            )).to.be.true;
            expect(traceInfoStub.calledWith(
                Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_CANCELLED
            )).to.be.true;
        });

        it('should handle authentication errors', async () => {
            const authError = new Error('Authentication failed');
            mockGetSession.rejects(authError);

            await loginToMatch(ServiceEndpointCategory.GCC);

            expect(mockShowErrorMessage.calledWith(Constants.Strings.AUTHENTICATION_FAILED)).to.be.true;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_FAILED);
            expect(traceErrorStub.firstCall.args[1]).to.equal(authError);
        });

        it('should use different endpoints based on service endpoint stamp', async () => {
            const mockSession = {
                accessToken: 'valid-token',
                account: { id: 'test-account', label: 'test@example.com' },
                id: 'session-id',
                scopes: []
            } as vscode.AuthenticationSession;

            mockGetSession.resolves(mockSession);

            // Test with undefined stamp (should still work)
            await loginToMatch(ServiceEndpointCategory.TEST);
            expect(mockGetSession.calledOnce).to.be.true;

            // Test with specific stamp
            await loginToMatch(ServiceEndpointCategory.DOD);
            expect(mockGetSession.calledTwice).to.be.true;
        });

        it('should include all required telemetry data', async () => {
            const mockSession = {
                accessToken: 'valid-token',
                account: { id: 'test-account', label: 'test@example.com' },
                id: 'session-id',
                scopes: []
            } as vscode.AuthenticationSession;

            mockGetSession.resolves(mockSession);

            await loginToMatch(ServiceEndpointCategory.HIGH);

            const traceInfoCall = traceInfoStub.getCalls().find((call: sinon.SinonSpyCall) =>
                call.args[0] === Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_CALLED
            );

            expect(traceInfoCall).to.not.be.undefined;
            if (traceInfoCall) {
                expect(traceInfoCall.args[1]).to.deep.include({
                    methodName: 'loginToMatch',
                    serviceEndpointStamp: ServiceEndpointCategory.HIGH,
                    hasEndpoint: true
                });
            }
        });

        it('should clear session preference and force new session', async () => {
            const mockSession = {
                accessToken: 'valid-token',
                account: { id: 'test-account', label: 'test@example.com' },
                id: 'session-id',
                scopes: []
            } as vscode.AuthenticationSession;

            mockGetSession.resolves(mockSession);

            await loginToMatch(ServiceEndpointCategory.MOONCAKE);

            // Verify that authentication was called with forceNewSession and clearSessionPreference
            const getSessionCall = mockGetSession.firstCall;
            expect(getSessionCall.args[2]).to.deep.include({
                forceNewSession: true,
                clearSessionPreference: true
            });
        });
    });
});
