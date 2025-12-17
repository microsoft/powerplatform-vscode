/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { previewSite } from '../../../../../power-pages/actions-hub/handlers/PreviewSiteHandler';
import { PreviewSite } from '../../../../../power-pages/preview-site/PreviewSite';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { WebsiteStatus } from '../../../../../power-pages/actions-hub/models/WebsiteStatus';
import { IWebsiteInfo } from '../../../../../power-pages/actions-hub/models/IWebsiteInfo';
import { SiteVisibility } from '../../../../../power-pages/actions-hub/models/SiteVisibility';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('PreviewSiteHandler', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(vscode.window, 'showInformationMessage');
        sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('previewSite', () => {
        let mockPreviewSiteClearCache: sinon.SinonStub;
        let mockLaunchBrowserAndDevTools: sinon.SinonStub;
        let mockSiteInfo: IWebsiteInfo;

        beforeEach(() => {
            mockPreviewSiteClearCache = sandbox.stub(PreviewSite, 'clearCache');
            mockLaunchBrowserAndDevTools = sandbox.stub(PreviewSite, 'launchBrowserAndDevToolsWithinVsCode');
            mockSiteInfo = {
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Public,
                siteManagementUrl: 'https://test-site-management.com',
                createdOn: "2025-03-20",
                creator: "Test Creator",
                isCodeSite: false
            };
        });

        it('should clear cache and launch browser with dev tools', async () => {
            const siteTreeItem = new SiteTreeItem(mockSiteInfo);

            await previewSite(siteTreeItem);

            expect(mockPreviewSiteClearCache.calledOnceWith('https://test-site.com')).to.be.true;
            expect(mockLaunchBrowserAndDevTools.calledOnceWith('https://test-site.com', 1)).to.be.true;
        });
    });
});
