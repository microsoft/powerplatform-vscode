/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { showEnvironmentDetails } from '../../../../../power-pages/actions-hub/handlers/ShowEnvironmentDetailsHandler';
import { Constants } from '../../../../../power-pages/actions-hub/Constants';
import { AuthInfo, CloudInstance, EnvironmentType, OrgInfo } from '../../../../../pac/PacTypes';
import PacContext from '../../../../../pac/PacContext';
import ArtemisContext from '../../../../../ArtemisContext';
import { ServiceEndpointCategory } from '../../../../../../common/services/Constants';
import { IArtemisAPIOrgResponse } from '../../../../../../common/services/Interfaces';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('ShowEnvironmentDetailsHandler', () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowInformationMessage: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
    let originalClipboard: typeof vscode.env.clipboard;
    let mockWriteText: sinon.SinonStub;

    const mockAuthInfo: AuthInfo = {
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

    const artemisResponse = {
        environment: 'cluster-env',
        clusterCategory: 'cluster-category',
        geoName: 'geo-name'
    } as IArtemisAPIOrgResponse;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
        ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.TEST, response: artemisResponse };
        traceErrorStub = sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');

        // Save original clipboard and create mock
        originalClipboard = vscode.env.clipboard;
        mockWriteText = sandbox.stub().resolves();
        Object.defineProperty(vscode.env, 'clipboard', {
            value: { writeText: mockWriteText, readText: sandbox.stub().resolves('') },
            configurable: true
        });
    });

    afterEach(() => {
        // Restore original clipboard
        Object.defineProperty(vscode.env, 'clipboard', {
            value: originalClipboard,
            configurable: true
        });
        sandbox.restore();
    });

    describe('showEnvironmentDetails', () => {
        it('should show information notification', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            mockShowInformationMessage.resolves(undefined);

            await showEnvironmentDetails();

            expect(mockShowInformationMessage.calledOnce).to.be.true;
        });

        it('should have expected heading', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            mockShowInformationMessage.resolves(undefined);

            await showEnvironmentDetails();

            const message = mockShowInformationMessage.firstCall.args[0];
            expect(message).to.include("Session Details");
        });

        it('should be rendered as modal', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            mockShowInformationMessage.resolves(undefined);

            await showEnvironmentDetails();

            const message = mockShowInformationMessage.firstCall.args[1];
            expect(message.modal).to.be.true;
        });

        it('should show environment details when auth info is available', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            PacContext['_orgInfo'] = mockOrgInfo;
            mockShowInformationMessage.resolves(undefined);

            await showEnvironmentDetails();

            expect(mockShowInformationMessage.calledOnce).to.be.true;

            const message = mockShowInformationMessage.firstCall.args[1].detail;
            expect(message).to.include("Timestamp");
            expect(message).to.include("Session ID: test-session-id");
            expect(message).to.include("Tenant ID: test-tenant");
            expect(message).to.include("Object ID: test-object-id");
            expect(message).to.include("Organization ID: test-org-id");
            expect(message).to.include("Unique name: test-org-name");
            expect(message).to.include("Instance url: test-org-url");
            expect(message).to.include("Environment ID: test-env-id");
            expect(message).to.include("Cluster environment: cluster-env");
            expect(message).to.include("Cluster category: cluster-cat");
            expect(message).to.include("Cluster geo name: geo-name");
        });

        it('should handle cases without auth info', async () => {
            PacContext['_authInfo'] = null;
            mockShowInformationMessage.resolves(undefined);

            await showEnvironmentDetails();

            expect(mockShowInformationMessage.calledOnce).to.be.true;
        });

        it('should handle errors appropriately', async () => {
            mockShowInformationMessage.throws(new Error('Test error'));

            await showEnvironmentDetails();

            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_FAILED);
        });

        it('should copy details to clipboard when user clicks copy button', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            PacContext['_orgInfo'] = mockOrgInfo;
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showEnvironmentDetails();

            expect(mockWriteText.calledOnce).to.be.true;
            const clipboardContent = mockWriteText.firstCall.args[0];
            expect(clipboardContent).to.include("Session ID: test-session-id");
            expect(clipboardContent).to.include("Tenant ID: test-tenant");
        });

        it('should not copy to clipboard when user dismisses dialog', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            mockShowInformationMessage.resolves(undefined);

            await showEnvironmentDetails();

            expect(mockWriteText.called).to.be.false;
        });
    });
});
