/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { clearCache } from '../../../../../power-pages/actions-hub/handlers/ClearCacheHandler';
import { PreviewSite } from '../../../../../power-pages/preview-site/PreviewSite';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { WebsiteStatus } from '../../../../../power-pages/actions-hub/models/WebsiteStatus';
import { IWebsiteInfo } from '../../../../../power-pages/actions-hub/models/IWebsiteInfo';
import { SiteVisibility } from '../../../../../power-pages/actions-hub/models/SiteVisibility';
import { Messages } from '../../../../../power-pages/preview-site/Constants';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('ClearCacheHandler', () => {
    let sandbox: sinon.SinonSandbox;
    let traceErrorStub: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        traceErrorStub = sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        traceInfoStub = sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('clearCache', () => {
        let mockPreviewSiteClearCache: sinon.SinonStub;
        let mockShowInformationMessage: sinon.SinonStub;
        let mockSiteInfo: IWebsiteInfo;

        beforeEach(() => {
            mockPreviewSiteClearCache = sandbox.stub(PreviewSite, 'clearCache');
            mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
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

        it('should clear cache with correct progress title and show success message', async () => {
            const siteTreeItem = new SiteTreeItem(mockSiteInfo);

            await clearCache(siteTreeItem);

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(mockPreviewSiteClearCache.calledOnce).to.be.true;
            expect(mockPreviewSiteClearCache.calledWith('https://test-site.com', Messages.CLEARING_SITE_CACHE)).to.be.true;
            expect(mockShowInformationMessage.calledOnce).to.be.true;
        });

        it('should handle errors and log telemetry', async () => {
            const error = new Error('Test error');
            mockPreviewSiteClearCache.rejects(error);
            const siteTreeItem = new SiteTreeItem(mockSiteInfo);

            await clearCache(siteTreeItem);

            expect(traceErrorStub.calledOnce).to.be.true;
            expect(mockShowInformationMessage.called).to.be.false;
        });
    });
});
