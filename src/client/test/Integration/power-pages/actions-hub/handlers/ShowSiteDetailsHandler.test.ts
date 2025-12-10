/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { showSiteDetails } from '../../../../../power-pages/actions-hub/handlers/ShowSiteDetailsHandler';
import { Constants } from '../../../../../power-pages/actions-hub/Constants';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { IWebsiteInfo } from '../../../../../power-pages/actions-hub/models/IWebsiteInfo';
import { SiteVisibility } from '../../../../../power-pages/actions-hub/models/SiteVisibility';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('ShowSiteDetailsHandler', () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowInformationMessage: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
        sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('showSiteDetails', () => {
        it('should show information notification', async () => {
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showSiteDetails({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockShowInformationMessage.calledOnce).to.be.true;
        });

        it('should have expected heading', async () => {
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showSiteDetails({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1
                } as IWebsiteInfo
            } as SiteTreeItem);

            const message = mockShowInformationMessage.firstCall.args[0];
            expect(message).to.include("Site Details");
        });

        it('should be rendered as modal', async () => {
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showSiteDetails({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1
                } as IWebsiteInfo
            } as SiteTreeItem);

            const message = mockShowInformationMessage.firstCall.args[1];
            expect(message.modal).to.be.true;
        });

        it('should show site details', async () => {
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showSiteDetails({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1,
                    websiteUrl: 'https://test-site.com',
                    siteVisibility: SiteVisibility.Public,
                    createdOn: "2025-03-20T00:00:00Z",
                    creator: "Test Creator"
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockShowInformationMessage.calledOnce).to.be.true;

            const message = mockShowInformationMessage.firstCall.args[1].detail;
            expect(message).to.include("Friendly name: Test Site");
            expect(message).to.include("Website Id: test-id");
            expect(message).to.include("Data model version: Standard");
            expect(message).to.include("Website Url: https://test-site.com");
            expect(message).to.include("Site visibility: Public");
            expect(message).to.include("Creator: Test Creator");
            expect(message).to.include("Created on: March 20, 2025");
        });
    });
});
