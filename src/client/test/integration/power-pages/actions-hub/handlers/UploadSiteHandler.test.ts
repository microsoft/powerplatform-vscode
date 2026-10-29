/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import fs from 'fs';
import { uploadSite } from '../../../../../power-pages/actions-hub/handlers/UploadSiteHandler';
import { Constants } from '../../../../../power-pages/actions-hub/Constants';
import { PacTerminal } from '../../../../../lib/PacTerminal';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { WebsiteStatus } from '../../../../../power-pages/actions-hub/models/WebsiteStatus';
import { SiteVisibility } from '../../../../../power-pages/actions-hub/models/SiteVisibility';
import CurrentSiteContext from '../../../../../power-pages/actions-hub/CurrentSiteContext';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';
import { PacWrapper } from '../../../../../pac/PacWrapper';
import * as AuthenticationProvider from '../../../../../../common/services/AuthenticationProvider';
import * as DataverseMetadata from '../../../../../../common/copilot/dataverseMetadata';

describe('UploadSiteHandler', () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowInformationMessage: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
    let mockShowErrorMessage: sinon.SinonStub;
    let isTrusted = true;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
        traceErrorStub = sandbox.stub(TelemetryHelper, 'traceError');
        mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');
        isTrusted = true;
        sandbox.stub(vscode.workspace, 'isTrusted').get(() => isTrusted);
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('uploadSite', () => {
        let getTerminalStub: sinon.SinonStub;
        let mockPacWrapper: sinon.SinonStubbedInstance<PacWrapper>;
        let upload: ReturnType<typeof uploadSite>;
        let mockSiteTreeItem: SiteTreeItem;

        beforeEach(() => {
            mockPacWrapper = sandbox.createStubInstance(PacWrapper);
            mockPacWrapper.uploadSiteWithProgress.resolves(true);
            mockPacWrapper.uploadCodeSiteWithProgress.resolves(true);
            const pacTerminal = sandbox.createStubInstance(PacTerminal);
            pacTerminal.getWrapper.returns(mockPacWrapper);
            upload = uploadSite(pacTerminal);
            mockSiteTreeItem = new SiteTreeItem({
                name: 'Test Site',
                websiteId: 'test-id',
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Private,
                siteManagementUrl: 'https://test-site-management.com',
                createdOn: '2025-03-20',
                creator: 'Test Creator',
                isCodeSite: true
            });

            // Set up CurrentSiteContext
            sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => "test-path");
            getTerminalStub = sinon.stub(PacTerminal, 'getTerminal');
        });

        afterEach(() => {
            expect(getTerminalStub.called).to.be.false;
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

            await upload(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.calledOnce).to.be.true;
            expect(mockShowInformationMessage.firstCall.args[0]).to.equal(Constants.Strings.SITE_UPLOAD_CONFIRMATION);

            expect(mockPacWrapper.uploadSiteWithProgress.calledOnceWithExactly('test-path', '1')).to.be.true;
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

            await upload(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.calledOnce).to.be.true;
            expect(mockPacWrapper.uploadSiteWithProgress.called).to.be.false;
            expect(mockPacWrapper.uploadCodeSiteWithProgress.called).to.be.false;
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

            await upload(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.called).to.be.false;
            expect(mockPacWrapper.uploadSiteWithProgress.calledOnceWithExactly('test-path', '1')).to.be.true;
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
            mockShowOpenDialog.resolves([vscode.Uri.file('D:\\foo')]);

            await upload(mockSiteTreeItem, "");

            expect(mockQuickPick.calledOnce, "showQuickPick was not called").to.be.true;
            expect(mockShowOpenDialog.calledOnce, "showOpenDialog was not called").to.be.true;
            expect(mockPacWrapper.uploadCodeSiteWithProgress.calledOnceWithExactly(
                'test-path', 'Test Site', undefined, vscode.Uri.file('D:\\foo').fsPath
            )).to.be.true;
            expect(mockPacWrapper.showOutputChannel.calledOnce).to.be.true;
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

            await upload(mockSiteTreeItem, "");

            expect(mockQuickPick.calledOnce).to.be.true;
            expect(mockShowOpenDialog.calledOnce).to.be.true;
            expect(mockShowErrorMessage.calledOnce).to.be.true;
            expect(mockPacWrapper.uploadCodeSiteWithProgress.called).to.be.false;
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
            mockShowOpenDialog.resolves([vscode.Uri.file('D:\\foo')]);

            mockPacWrapper.uploadCodeSiteWithProgress.rejects(new Error('Upload code site failed'));

            await upload(mockSiteTreeItem, "");

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

            await upload(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.calledOnce).to.be.true;
            expect(mockPacWrapper.uploadSiteWithProgress.calledOnceWithExactly('test-path', '1')).to.be.true;
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

            mockPacWrapper.uploadSiteWithProgress.rejects(new Error('Upload failed'));

            await upload(mockSiteTreeItem, "");

            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_FAILED);
            expect(mockShowErrorMessage.calledOnceWith(Constants.Strings.UPLOAD_CODE_SITE_FAILED)).to.be.true;
        });

        for (const config of [
            {},
            { compiledPath: 'dist' },
            { siteName: 'Configured site' },
            { compiledPath: 'dist', siteName: 'Configured site' },
            { compiledPath: '', siteName: '' }
        ]) {
            it(`should preserve config overrides for ${JSON.stringify(config)}`, async () => {
                sandbox.stub(fs, 'existsSync').returns(true);
                sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(config));
                const quickPick = sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: Constants.Strings.BROWSE });
                const compiledUri = vscode.Uri.file('D:\\compiled output');
                const openDialog = sandbox.stub(vscode.window, 'showOpenDialog').resolves([compiledUri]);

                await upload(mockSiteTreeItem, 'D:\\site root');

                expect(mockPacWrapper.uploadCodeSiteWithProgress.calledOnceWithExactly(
                    'D:\\site root',
                    config.siteName ? undefined : 'Test Site',
                    undefined,
                    config.compiledPath ? undefined : compiledUri.fsPath
                )).to.be.true;
                expect(quickPick.called).to.equal(!config.compiledPath);
                expect(openDialog.called).to.equal(!config.compiledPath);
            });
        }

        it('should pass metadata names and paths as literal arguments for other code sites', async () => {
            const name = 'Site "quoted"; $(`value`) & %PATH%\nnext';
            const folderPath = 'site "quoted"; $(value) & folder';
            mockSiteTreeItem = new SiteTreeItem({
                ...mockSiteTreeItem.siteInfo, name, folderPath, status: undefined
            });
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({ compiledPath: 'dist' }));

            await upload(mockSiteTreeItem, '');

            expect(mockPacWrapper.uploadCodeSiteWithProgress.calledOnceWithExactly(
                folderPath, name, undefined, undefined
            )).to.be.true;
        });

        it('should retain fallback arguments after a config parse failure', async () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns('{invalid');
            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: Constants.Strings.BROWSE });
            const compiledUri = vscode.Uri.file('D:\\dist');
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([compiledUri]);

            await upload(mockSiteTreeItem, '');

            expect(traceErrorStub.calledOnceWith(Constants.EventNames.POWER_PAGES_CONFIG_PARSE_FAILED)).to.be.true;
            expect(mockPacWrapper.uploadCodeSiteWithProgress.calledOnceWithExactly(
                'test-path', 'Test Site', undefined, compiledUri.fsPath
            )).to.be.true;
        });

        it('should not upload when the compiled output picker is dismissed', async () => {
            sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);

            await upload(mockSiteTreeItem, '');

            expect(mockPacWrapper.uploadCodeSiteWithProgress.called).to.be.false;
            expect(mockShowErrorMessage.calledOnceWith(Constants.Strings.UPLOAD_CODE_SITE_COMPILED_OUTPUT_FOLDER_NOT_FOUND)).to.be.true;
        });

        it('should report an unsuccessful code site upload', async () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({ compiledPath: 'dist', siteName: 'Configured site' }));
            mockPacWrapper.uploadCodeSiteWithProgress.resolves(false);

            await upload(mockSiteTreeItem, '');

            expect(traceErrorStub.calledOnceWith(Constants.EventNames.ACTIONS_HUB_UPLOAD_CODE_SITE_FAILED)).to.be.true;
            expect(mockShowErrorMessage.calledOnceWith(Constants.Strings.UPLOAD_CODE_SITE_FAILED)).to.be.true;
        });

        for (const isCodeSite of [true, false]) {
            it(`should block ${isCodeSite ? 'code' : 'classic'} uploads in an untrusted workspace`, async () => {
                isTrusted = false;
                mockSiteTreeItem.siteInfo.isCodeSite = isCodeSite;
                const existsSync = sandbox.stub(fs, 'existsSync');

                await upload(mockSiteTreeItem, '');

                expect(existsSync.called).to.be.false;
                expect(mockPacWrapper.uploadCodeSiteWithProgress.called).to.be.false;
                expect(mockPacWrapper.uploadSiteWithProgress.called).to.be.false;
                expect(mockShowErrorMessage.calledOnceWith(Constants.Strings.UPLOAD_SITE_REQUIRES_TRUST)).to.be.true;
            });
        }

        for (const isEdmSupported of [true, false]) {
            it(`should preserve the other-site model version when EDM support is ${isEdmSupported}`, async () => {
                const folderPath = 'site "quoted"; $(value)';
                mockSiteTreeItem = new SiteTreeItem({
                    ...mockSiteTreeItem.siteInfo,
                    isCodeSite: false,
                    folderPath,
                    status: undefined
                });
                sandbox.stub(AuthenticationProvider, 'dataverseAuthentication').resolves({
                    accessToken: 'test-token',
                    userId: 'test-user'
                });
                sandbox.stub(DataverseMetadata, 'isEdmEnvironment').resolves(isEdmSupported);

                await upload(mockSiteTreeItem, '');

                expect(mockPacWrapper.uploadSiteWithProgress.calledOnceWithExactly(
                    folderPath, isEdmSupported ? '2' : undefined
                )).to.be.true;
            });
        }

        it('should report an unsuccessful classic site upload', async () => {
            mockSiteTreeItem.siteInfo.isCodeSite = false;
            mockPacWrapper.uploadSiteWithProgress.resolves(false);

            await upload(mockSiteTreeItem, '');

            expect(traceErrorStub.calledOnceWith(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_FAILED)).to.be.true;
            expect(mockShowErrorMessage.calledOnceWith(Constants.Strings.UPLOAD_CODE_SITE_FAILED)).to.be.true;
        });
    });
});
