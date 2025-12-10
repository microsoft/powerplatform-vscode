/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { openSiteManagement } from '../../../../../power-pages/actions-hub/handlers/OpenSiteManagementHandler';
import { Constants } from '../../../../../power-pages/actions-hub/Constants';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { WebsiteStatus } from '../../../../../power-pages/actions-hub/models/WebsiteStatus';
import { IWebsiteInfo } from '../../../../../power-pages/actions-hub/models/IWebsiteInfo';
import { SiteVisibility } from '../../../../../power-pages/actions-hub/models/SiteVisibility';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('OpenSiteManagementHandler', () => {
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

    describe('openSiteManagement', () => {
        let mockUrl: sinon.SinonSpy;

        beforeEach(() => {
            mockUrl = sandbox.spy(vscode.Uri, 'parse');
            sandbox.stub(vscode.env, 'openExternal');
        });

        it('should open site management URL when available', async () => {
            await openSiteManagement({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1,
                    status: WebsiteStatus.Active,
                    websiteUrl: 'https://test-site.com',
                    isCurrent: false,
                    siteVisibility: SiteVisibility.Private,
                    siteManagementUrl: "https://test-site-management.com",
                    createdOn: "2025-03-20",
                    creator: "Test Creator"
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockUrl.calledOnce).to.be.true;
            expect(mockUrl.firstCall.args[0]).to.equal('https://test-site-management.com');
        });

        it('should show error message when site management URL is not available', async () => {
            const mockErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');

            await openSiteManagement({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1,
                    status: WebsiteStatus.Active,
                    websiteUrl: 'https://test-site.com',
                    isCurrent: false,
                    siteVisibility: SiteVisibility.Private,
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockErrorMessage.calledOnce).to.be.true;
            expect(mockErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.SITE_MANAGEMENT_URL_NOT_FOUND);
        });

        it('should show log error when site management URL is not available', async () => {
            sandbox.stub(vscode.window, 'showErrorMessage');

            await openSiteManagement({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1,
                    status: WebsiteStatus.Active,
                    websiteUrl: 'https://test-site.com',
                    isCurrent: false,
                    siteVisibility: SiteVisibility.Private
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND);
            expect(traceErrorStub.firstCall.args[2]).to.deep.equal({ method: openSiteManagement.name, siteId: 'test-id' });
        });
    });
});
