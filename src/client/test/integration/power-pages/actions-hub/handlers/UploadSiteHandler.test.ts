/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { uploadSite } from '../../../../../power-pages/actions-hub/handlers/UploadSiteHandler';
import { Constants } from '../../../../../power-pages/actions-hub/Constants';
import { PacTerminal } from '../../../../../lib/PacTerminal';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { WebsiteStatus } from '../../../../../power-pages/actions-hub/models/WebsiteStatus';
import { SiteVisibility } from '../../../../../power-pages/actions-hub/models/SiteVisibility';
import CurrentSiteContext from '../../../../../power-pages/actions-hub/CurrentSiteContext';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('UploadSiteHandler', () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowInformationMessage: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
        traceErrorStub = sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('uploadSite', () => {
        let mockSendText: sinon.SinonStub;
        let mockSiteTreeItem: SiteTreeItem;

        beforeEach(() => {
            mockSendText = sinon.stub();

            // Set up CurrentSiteContext
            sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => "test-path");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sinon.stub(PacTerminal, 'getTerminal').returns({ sendText: mockSendText } as any);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should show confirmation dialog and upload when user confirms for public site', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Public,
                siteManagementUrl: "https://inactive-site-1-management.com",
                createdOn: "2025-03-20",
                creator: "Test Creator",
                isCodeSite: false
            });
            mockShowInformationMessage.resolves(Constants.Strings.YES);

            await uploadSite(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.calledOnce).to.be.true;
            expect(mockShowInformationMessage.firstCall.args[0]).to.equal(Constants.Strings.SITE_UPLOAD_CONFIRMATION);

            expect(mockSendText.calledOnceWith(`pac pages upload --path "test-path" --modelVersion "1"`)).to.be.true;
        });

        it('should not upload when user cancels confirmation for public site', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Public,
                siteManagementUrl: "https://inactive-site-1-management.com",
                createdOn: "2025-03-20",
                creator: "Test Creator",
                isCodeSite: false
            });
            mockShowInformationMessage.resolves(undefined);

            await uploadSite(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.calledOnce).to.be.true;
            expect(mockSendText.called).to.be.false;
        });

        it('should upload without confirmation for private site', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Private,
                siteManagementUrl: "https://inactive-site-1-management.com",
                createdOn: "2025-03-20",
                creator: "Test Creator",
                isCodeSite: false
            });

            await uploadSite(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.called).to.be.false;
            expect(mockSendText.calledOnceWith(`pac pages upload --path "test-path" --modelVersion "1"`)).to.be.true;
        });

        it('should upload code site', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Private,
                siteManagementUrl: "https://inactive-site-1-management.com",
                createdOn: "2025-03-20",
                creator: "Test Creator",
                isCodeSite: true
            });

            const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
            mockQuickPick.resolves({ label: "Browse..." });

            const mockShowOpenDialog = sinon.stub(vscode.window, 'showOpenDialog');
            mockShowOpenDialog.resolves([{ fsPath: "D:/foo" } as unknown as vscode.Uri]);

            await uploadSite(mockSiteTreeItem, "");

            expect(mockQuickPick.calledOnce, "showQuickPick was not called").to.be.true;
            expect(mockShowOpenDialog.calledOnce, "showOpenDialog was not called").to.be.true;
            expect(mockSendText.firstCall.args[0]).to.equal(`pac pages upload-code-site --rootPath "test-path" --compiledPath "D:/foo" --siteName "Test Site"`);
        });

        it('should not upload code site when compiledPath selection is cancelled', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Private,
                siteManagementUrl: "https://inactive-site-1-management.com",
                createdOn: "2025-03-20",
                creator: "Test Creator",
                isCodeSite: true
            });

            const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
            mockQuickPick.resolves({ label: "Browse..." });

            const mockShowOpenDialog = sinon.stub(vscode.window, 'showOpenDialog');
            mockShowOpenDialog.resolves(undefined);

            const mockShowErrorMessage = sinon.stub(vscode.window, 'showErrorMessage');

            await uploadSite(mockSiteTreeItem, "");

            expect(mockQuickPick.calledOnce).to.be.true;
            expect(mockShowOpenDialog.calledOnce).to.be.true;
            expect(mockShowErrorMessage.calledOnce).to.be.true;
            expect(mockSendText.called).to.be.false;
        });

        it('should handle errors during code site upload', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Private,
                siteManagementUrl: "https://inactive-site-1-management.com",
                createdOn: "2025-03-20",
                creator: "Test Creator",
                isCodeSite: true
            });

            const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
            mockQuickPick.resolves({ label: "Browse..." });

            const mockShowOpenDialog = sinon.stub(vscode.window, 'showOpenDialog');
            mockShowOpenDialog.resolves([{ fsPath: "D:/foo" } as unknown as vscode.Uri]);

            const mockShowErrorMessage = sinon.stub(vscode.window, 'showErrorMessage');
            mockSendText.throws(new Error('Upload code site failed'));

            await uploadSite(mockSiteTreeItem, "");

            expect(mockQuickPick.calledOnce).to.be.true;
            expect(mockShowOpenDialog.calledOnce).to.be.true;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_UPLOAD_CODE_SITE_FAILED);
            expect(mockShowErrorMessage.calledOnce).to.be.true;
        });

        it('should handle case sensitivity for public site visibility', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Public,
                siteManagementUrl: "https://inactive-site-1-management.com",
                createdOn: "2025-03-20",
                creator: "Test Creator",
                isCodeSite: false
            });
            mockShowInformationMessage.resolves(Constants.Strings.YES);

            await uploadSite(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.calledOnce).to.be.true;
            expect(mockSendText.calledOnceWith(`pac pages upload --path "test-path" --modelVersion "1"`)).to.be.true;
        });

        it('should handle errors during upload', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Private,
                siteManagementUrl: "https://inactive-site-1-management.com",
                createdOn: "2025-03-20",
                creator: "Test Creator",
                isCodeSite: false
            });

            mockSendText.throws(new Error('Upload failed'));

            await uploadSite(mockSiteTreeItem, "");

            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_FAILED);
        });
    });
});
