/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { pacAuthManager } from "../../../../pac/PacAuthManager";
import { showEnvironmentDetails } from '../../../../power-pages/actions-hub/Utils';
import { Constants } from '../../../../power-pages/actions-hub/Constants';
import { oneDSLoggerWrapper } from '../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';

describe('Utils', () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowInformationMessage: sinon.SinonStub;
    let mockGetAuthInfo: sinon.SinonStub;
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
        mockGetAuthInfo = sandbox.stub(pacAuthManager, 'getAuthInfo');
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
});
