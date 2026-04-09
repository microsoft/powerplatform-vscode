/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import { cloneSite } from '../../../../../power-pages/actions-hub/handlers/CloneSiteHandler';
import { Constants } from '../../../../../power-pages/actions-hub/Constants';
import { PacTerminal } from '../../../../../lib/PacTerminal';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { IWebsiteInfo } from '../../../../../power-pages/actions-hub/models/IWebsiteInfo';
import { WebsiteStatus } from '../../../../../power-pages/actions-hub/models/WebsiteStatus';
import { SiteVisibility } from '../../../../../power-pages/actions-hub/models/SiteVisibility';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('CloneSiteHandler', () => {
    let sandbox: sinon.SinonSandbox;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
    let mockPacTerminal: sinon.SinonStubbedInstance<PacTerminal>;
    let mockPacWrapper: {
        downloadSiteWithProgress: sinon.SinonStub;
        downloadCodeSiteWithProgress: sinon.SinonStub;
        cloneSiteWithProgress: sinon.SinonStub;
        uploadSiteWithProgress: sinon.SinonStub;
        uploadCodeSiteWithProgress: sinon.SinonStub;
    };
    let executeCommandStub: sinon.SinonStub;
    let readdirSyncStub: sinon.SinonStub;

    const mockDirEntry = (name: string) => ({
        name,
        isDirectory: () => true,
        isFile: () => false,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isSymbolicLink: () => false,
        isFIFO: () => false,
        isSocket: () => false,
        path: '',
        parentPath: '',
    } as unknown as fs.Dirent);

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(vscode.window, 'showInformationMessage');
        traceErrorStub = sandbox.stub(TelemetryHelper, 'traceError');
        traceInfoStub = sandbox.stub(TelemetryHelper, 'traceInfo');
        sandbox.stub(TelemetryHelper, 'getBaseEventInfo').returns({ foo: 'bar' });
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');

        executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();

        // Stub fs-extra operations
        sandbox.stub(fs, 'ensureDirSync');
        readdirSyncStub = sandbox.stub(fs, 'readdirSync').returns([mockDirEntry('test-site')]);
        sandbox.stub(fs, 'remove').resolves();

        mockPacTerminal = sandbox.createStubInstance(PacTerminal);

        mockPacWrapper = {
            downloadSiteWithProgress: sandbox.stub().resolves(true),
            downloadCodeSiteWithProgress: sandbox.stub().resolves(true),
            cloneSiteWithProgress: sandbox.stub().resolves(true),
            uploadSiteWithProgress: sandbox.stub().resolves(true),
            uploadCodeSiteWithProgress: sandbox.stub().resolves(true),
        };
        mockPacTerminal.getWrapper.returns(mockPacWrapper as unknown as ReturnType<PacTerminal['getWrapper']>);
    });

    afterEach(() => {
        sandbox.restore();
    });

    function createMockSiteTreeItem(overrides: Partial<IWebsiteInfo> = {}): SiteTreeItem {
        const defaultSiteInfo: IWebsiteInfo = {
            name: 'Test Site',
            websiteId: 'test-site-id',
            dataModelVersion: 2,
            status: WebsiteStatus.Active,
            websiteUrl: 'https://test-site.com',
            isCurrent: true,
            siteVisibility: SiteVisibility.Public,
            siteManagementUrl: 'https://management.com',
            createdOn: '2025-03-20',
            creator: 'Test Creator',
            isCodeSite: false,
            ...overrides
        };
        return new SiteTreeItem(defaultSiteInfo);
    }

    describe('cloneSite', () => {
        describe('when user cancels clone name input', () => {
            it('should return early without any operations', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(mockPacWrapper.downloadSiteWithProgress.called).to.be.false;
                expect(mockPacWrapper.cloneSiteWithProgress.called).to.be.false;
                expect(mockPacWrapper.uploadSiteWithProgress.called).to.be.false;
            });
        });

        describe('when input box is shown', () => {
            it('should prepopulate with "Copy of <site name>"', async () => {
                const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem({ name: 'My Website' }));

                expect(showInputBoxStub.calledOnce).to.be.true;
                expect(showInputBoxStub.firstCall.args[0]?.value).to.equal('Copy of My Website');
            });

            it('should validate that site name is not empty', async () => {
                const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                const validateInput = showInputBoxStub.firstCall.args[0]?.validateInput;
                expect(validateInput).to.be.a('function');
                expect(validateInput?.('')).to.equal(Constants.Strings.CLONE_SITE_NAME_VALIDATION);
                expect(validateInput?.('  ')).to.equal(Constants.Strings.CLONE_SITE_NAME_VALIDATION);
                expect(validateInput?.('Valid Name')).to.be.null;
            });
        });

        describe('successful clone flow', () => {
            it('should execute download, clone, and upload in sequence for regular sites', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem({ isCodeSite: false, dataModelVersion: 2 }));

                expect(mockPacWrapper.downloadSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.downloadSiteWithProgress.firstCall.args[1]).to.equal('test-site-id');
                expect(mockPacWrapper.downloadSiteWithProgress.firstCall.args[2]).to.equal(2);

                expect(mockPacWrapper.cloneSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.cloneSiteWithProgress.firstCall.args[2]).to.equal('Copy of Test Site');

                expect(mockPacWrapper.uploadSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.uploadSiteWithProgress.firstCall.args[1]).to.equal('2');
            });

            it('should use downloadCodeSiteWithProgress for code sites', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem({ isCodeSite: true }));

                expect(mockPacWrapper.downloadCodeSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.downloadSiteWithProgress.called).to.be.false;
            });

            it('should use uploadCodeSiteWithProgress for code sites', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem({ isCodeSite: true }));

                expect(mockPacWrapper.uploadCodeSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.uploadCodeSiteWithProgress.firstCall.args[1]).to.equal('Copy of Test Site');
                expect(mockPacWrapper.uploadSiteWithProgress.called).to.be.false;
            });

            it('should use uploadSiteWithProgress for regular sites', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem({ isCodeSite: false, dataModelVersion: 2 }));

                expect(mockPacWrapper.uploadSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.uploadSiteWithProgress.firstCall.args[1]).to.equal('2');
                expect(mockPacWrapper.uploadCodeSiteWithProgress.called).to.be.false;
            });

            it('should use temp directories and find site subfolder for clone and upload', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                const downloadPath = mockPacWrapper.downloadSiteWithProgress.firstCall.args[0] as string;
                const cloneSourcePath = mockPacWrapper.cloneSiteWithProgress.firstCall.args[0] as string;
                const cloneOutputPath = mockPacWrapper.cloneSiteWithProgress.firstCall.args[1] as string;
                const uploadPath = mockPacWrapper.uploadSiteWithProgress.firstCall.args[0] as string;

                // Clone source should be inside the download path (the site subfolder)
                expect(cloneSourcePath).to.include(downloadPath);
                expect(cloneSourcePath).to.include('test-site');
                // Upload path should be inside the clone output (the cloned site subfolder)
                expect(uploadPath).to.include(cloneOutputPath);
                expect(uploadPath).to.include('test-site');
                // Paths should be in temp directory
                expect(downloadPath).to.include('pp-clone-');
            });

            it('should log completion telemetry on success', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_COMPLETED)).to.be.true;
            });

            it('should refresh the Actions Hub tree after successful clone', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(executeCommandStub.calledWith('microsoft.powerplatform.pages.actionsHub.refresh')).to.be.true;
            });
        });

        describe('when download succeeds but site folder not found', () => {
            it('should show error and not proceed to clone', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Clone Name');
                const mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');

                // Return empty directory - no site subfolder
                readdirSyncStub.returns([]);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(mockPacWrapper.downloadSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.cloneSiteWithProgress.called).to.be.false;
                expect(mockPacWrapper.uploadSiteWithProgress.called).to.be.false;
                expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_DOWNLOAD_FAILED)).to.be.true;
                expect(mockShowErrorMessage.calledOnce).to.be.true;
            });
        });

        describe('when download fails', () => {
            it('should not proceed to clone or upload and show error', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Clone Name');
                const mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');

                mockPacWrapper.downloadSiteWithProgress.resolves(false);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(mockPacWrapper.downloadSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.cloneSiteWithProgress.called).to.be.false;
                expect(mockPacWrapper.uploadSiteWithProgress.called).to.be.false;
                expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_DOWNLOAD_FAILED)).to.be.true;
                expect(mockShowErrorMessage.calledOnce).to.be.true;
            });
        });

        describe('when clone fails', () => {
            it('should not proceed to upload and show error', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Clone Name');
                const mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');

                mockPacWrapper.cloneSiteWithProgress.resolves(false);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(mockPacWrapper.downloadSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.cloneSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.uploadSiteWithProgress.called).to.be.false;
                expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_FAILED)).to.be.true;
                expect(mockShowErrorMessage.calledOnce).to.be.true;
            });
        });

        describe('when upload fails', () => {
            it('should show error message and not refresh', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Clone Name');
                const mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');

                mockPacWrapper.uploadSiteWithProgress.resolves(false);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(mockPacWrapper.downloadSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.cloneSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.uploadSiteWithProgress.calledOnce).to.be.true;
                expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_UPLOAD_CLONED_SITE_FAILED)).to.be.true;
                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(executeCommandStub.calledWith('microsoft.powerplatform.pages.actionsHub.refresh')).to.be.false;
            });
        });

        describe('when an exception is thrown', () => {
            it('should catch the error and log telemetry', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Clone Name');

                mockPacWrapper.downloadSiteWithProgress.throws(new Error('Unexpected error'));

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_FAILED)).to.be.true;
            });
        });

        describe('telemetry', () => {
            it('should log initial telemetry event when handler is called', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem({ websiteId: 'my-site-id', dataModelVersion: 2 }));

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_CALLED)).to.be.true;
                const callArgs = traceInfoStub.getCalls().find(
                    call => call.args[0] === Constants.EventNames.ACTIONS_HUB_CLONE_SITE_CALLED
                )?.args[1];
                expect(callArgs).to.deep.include({
                    methodName: 'cloneSite',
                    siteId: 'my-site-id',
                    dataModelVersion: 2
                });
            });

            it('should log telemetry for all three steps on success', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Clone Name');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_DOWNLOAD_TRIGGERED)).to.be.true;
                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_PAC_TRIGGERED)).to.be.true;
                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_UPLOAD_CLONED_SITE_PAC_TRIGGERED)).to.be.true;
                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_COMPLETED)).to.be.true;
            });
        });
    });
});
