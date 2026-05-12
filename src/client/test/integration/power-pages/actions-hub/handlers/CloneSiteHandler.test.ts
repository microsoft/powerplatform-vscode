/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs-extra';
import path from 'path';
import { cloneSite } from '../../../../../power-pages/actions-hub/handlers/CloneSiteHandler';
import { Constants } from '../../../../../power-pages/actions-hub/Constants';
import { PacTerminal } from '../../../../../lib/PacTerminal';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { IWebsiteInfo } from '../../../../../power-pages/actions-hub/models/IWebsiteInfo';
import { WebsiteStatus } from '../../../../../power-pages/actions-hub/models/WebsiteStatus';
import { SiteVisibility } from '../../../../../power-pages/actions-hub/models/SiteVisibility';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';
import PacContext from '../../../../../pac/PacContext';
import * as Utils from '../../../../../../common/utilities/Utils';

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
        showOutputChannel: sinon.SinonStub;
    };
    let executeCommandStub: sinon.SinonStub;
    let showProgressStub: sinon.SinonStub;
    let progressReportStub: sinon.SinonStub;
    let showInformationMessageStub: sinon.SinonStub;

    /**
     * Simulates what the PAC CLI download/clone commands do:
     * create a site subfolder inside the target directory, containing
     * `website.yml` so it is identifiable as a real Power Pages site root.
     */
    const simulateSiteSubfolderCreation = (stub: sinon.SinonStub) => {
        stub.callsFake((...args: string[]) => {
            const targetDir = args[0];
            const siteFolder = path.join(targetDir, 'test-site');
            fs.ensureDirSync(siteFolder);
            fs.writeFileSync(path.join(siteFolder, 'website.yml'), 'adx_name: test-site');
            return Promise.resolve(true);
        });
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');
        traceErrorStub = sandbox.stub(TelemetryHelper, 'traceError');
        traceInfoStub = sandbox.stub(TelemetryHelper, 'traceInfo');
        sandbox.stub(TelemetryHelper, 'getBaseEventInfo').returns({ foo: 'bar' });
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');

        executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();

        // Default environment context for the upload-step progress message.
        // Individual tests override this when they need an empty environment name.
        sandbox.stub(PacContext, 'AuthInfo').get(() => ({ OrganizationFriendlyName: 'Test Environment' }));

        // Spy on the progress wrapper so tests can assert that the whole
        // clone pipeline runs inside ONE notification, with the right
        // step messages reported via progress.report().
        progressReportStub = sandbox.stub();
        showProgressStub = sandbox.stub(Utils, 'showProgressWithNotification').callsFake(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (_title: string, _cancellable: boolean, task: (progress: any, token: any) => Promise<any>) => {
                const token = {
                    isCancellationRequested: false,
                    onCancellationRequested: () => ({ dispose: () => { /* noop */ } }),
                } as unknown as vscode.CancellationToken;
                return task({ report: progressReportStub }, token);
            }
        );

        mockPacTerminal = sandbox.createStubInstance(PacTerminal);

        mockPacWrapper = {
            downloadSiteWithProgress: sandbox.stub().resolves(true),
            downloadCodeSiteWithProgress: sandbox.stub().resolves(true),
            cloneSiteWithProgress: sandbox.stub().resolves(true),
            uploadSiteWithProgress: sandbox.stub().resolves(true),
            uploadCodeSiteWithProgress: sandbox.stub().resolves(true),
            showOutputChannel: sandbox.stub(),
        };

        // Simulate site subfolder creation for download and clone
        simulateSiteSubfolderCreation(mockPacWrapper.downloadSiteWithProgress);
        simulateSiteSubfolderCreation(mockPacWrapper.downloadCodeSiteWithProgress);
        mockPacWrapper.cloneSiteWithProgress.callsFake((_src: string, outputDir: string) => {
            const siteFolder = path.join(outputDir, 'test-site-clone');
            fs.ensureDirSync(siteFolder);
            fs.writeFileSync(path.join(siteFolder, 'website.yml'), 'adx_name: test-site-clone');
            return Promise.resolve(true);
        });

        mockPacTerminal.getWrapper.returns(mockPacWrapper as unknown as ReturnType<PacTerminal['getWrapper']>);
    });

    afterEach(() => {
        sandbox.restore();

        // Clean up any leftover temp dirs
        const tmpDir = os.tmpdir();
        const entries = fs.readdirSync(tmpDir).filter(e => e.startsWith('pp-clone-'));
        for (const entry of entries) {
            fs.removeSync(path.join(tmpDir, entry));
        }
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

            it('should pass discovered site subfolder paths to clone and upload', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                const downloadPath = mockPacWrapper.downloadSiteWithProgress.firstCall.args[0] as string;
                const cloneSourcePath = mockPacWrapper.cloneSiteWithProgress.firstCall.args[0] as string;
                const cloneOutputPath = mockPacWrapper.cloneSiteWithProgress.firstCall.args[1] as string;
                const uploadPath = mockPacWrapper.uploadSiteWithProgress.firstCall.args[0] as string;

                // Clone source should point to the site subfolder inside the download dir
                expect(cloneSourcePath).to.equal(path.join(downloadPath, 'test-site'));
                // Upload path should point to the site subfolder inside the clone output dir
                expect(uploadPath).to.equal(path.join(cloneOutputPath, 'test-site-clone'));
                // Paths should be in temp directory
                expect(downloadPath).to.include('pp-clone-');
            });

            it('should ignore hidden folders (e.g. .portalconfig) when locating cloned site content', async () => {
                // Simulate the real `pac pages clone` output for a non-code site:
                // `website.yml` lives directly in the output directory alongside
                // several visible content subfolders (basic-forms/, web-pages/,
                // web-templates/, webfiles/, ...) and a hidden `.portalconfig/`.
                // The site root is the output directory itself — none of those
                // content subfolders contains `website.yml`.
                mockPacWrapper.cloneSiteWithProgress.callsFake((_src: string, outputDir: string) => {
                    fs.ensureDirSync(path.join(outputDir, '.portalconfig'));
                    fs.ensureDirSync(path.join(outputDir, 'basic-forms'));
                    fs.ensureDirSync(path.join(outputDir, 'web-pages'));
                    fs.ensureDirSync(path.join(outputDir, 'web-templates'));
                    fs.ensureDirSync(path.join(outputDir, 'webfiles'));
                    fs.writeFileSync(path.join(outputDir, 'website.yml'), 'adx_name: cloned-site');
                    return Promise.resolve(true);
                });
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem({ isCodeSite: false, dataModelVersion: 2 }));

                const cloneOutputPath = mockPacWrapper.cloneSiteWithProgress.firstCall.args[1] as string;
                const uploadPath = mockPacWrapper.uploadSiteWithProgress.firstCall.args[0] as string;

                // Upload must target the clone output dir itself, not a content
                // subfolder (regression guard for the original bug where the
                // first visible subfolder, e.g. basic-forms/, was picked).
                expect(uploadPath).to.equal(cloneOutputPath);
                expect(uploadPath).to.not.include('.portalconfig');
                expect(uploadPath).to.not.include('basic-forms');
                expect(uploadPath).to.not.include('web-pages');
                expect(uploadPath).to.not.include('web-templates');
                expect(uploadPath).to.not.include('webfiles');
            });

            it('should locate the code-site subfolder by its .powerpages-site marker', async () => {
                // Simulate `pac pages clone` of a code site: a single visible
                // subfolder containing a `.powerpages-site/website.yml` marker.
                mockPacWrapper.cloneSiteWithProgress.callsFake((_src: string, outputDir: string) => {
                    const siteFolder = path.join(outputDir, 'my-code-site-clone');
                    fs.ensureDirSync(path.join(siteFolder, '.powerpages-site'));
                    fs.writeFileSync(
                        path.join(siteFolder, '.powerpages-site', 'website.yml'),
                        'adx_name: cloned-code-site'
                    );
                    return Promise.resolve(true);
                });
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem({ isCodeSite: true }));

                const cloneOutputPath = mockPacWrapper.cloneSiteWithProgress.firstCall.args[1] as string;
                const uploadPath = mockPacWrapper.uploadCodeSiteWithProgress.firstCall.args[0] as string;

                expect(uploadPath).to.equal(path.join(cloneOutputPath, 'my-code-site-clone'));
            });

            it('should log completion telemetry on success', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_COMPLETED)).to.be.true;
            });

            it('should show a success notification including the new cloned site name', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('My Brand New Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(showInformationMessageStub.calledOnce).to.be.true;
                const successMessage = showInformationMessageStub.firstCall.args[0] as string;
                expect(successMessage).to.equal(
                    Constants.StringFunctions.CLONE_SITE_SUCCESS('My Brand New Site')
                );
                expect(successMessage).to.include("'My Brand New Site'");
            });

            it('should refresh the Actions Hub tree after successful clone', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(executeCommandStub.calledWith('microsoft.powerplatform.pages.actionsHub.refresh')).to.be.true;
            });

            it('should refresh the tree even when the success notification is not dismissed', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                // Simulate an info toast that never resolves (user does not dismiss it).
                // The refresh must still run; this catches `await showInformationMessage`
                // accidentally blocking the refresh.
                const sandboxAny = sandbox as unknown as { stub: (obj: unknown, key: string) => sinon.SinonStub };
                const existingStub = (vscode.window.showInformationMessage as unknown as sinon.SinonStub);
                if (existingStub && typeof existingStub.restore === 'function') {
                    existingStub.restore();
                }
                sandboxAny.stub(vscode.window, 'showInformationMessage').returns(new Promise(() => { /* never resolves */ }));

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(executeCommandStub.calledWith('microsoft.powerplatform.pages.actionsHub.refresh')).to.be.true;
            });
        });

        describe('cancellation', () => {
            const makeToken = (cancelled: boolean): vscode.CancellationToken => ({
                isCancellationRequested: cancelled,
                onCancellationRequested: () => ({ dispose: () => { /* noop */ } }),
            } as unknown as vscode.CancellationToken);

            it('should request a cancellable progress notification', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                // Second argument to showProgressWithNotification controls whether
                // the notification renders a Cancel button.
                expect(showProgressStub.calledOnce).to.be.true;
                expect(showProgressStub.firstCall.args[1]).to.equal(true);
            });

            it('should pass the cancellation token to each PAC step', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem({ isCodeSite: false, dataModelVersion: 2 }));

                // Each `*WithProgress` helper accepts CancellationToken as its
                // last parameter, so the handler can plumb cancellation through.
                const downloadArgs = mockPacWrapper.downloadSiteWithProgress.firstCall.args;
                const cloneArgs = mockPacWrapper.cloneSiteWithProgress.firstCall.args;
                const uploadArgs = mockPacWrapper.uploadSiteWithProgress.firstCall.args;
                const downloadToken = downloadArgs[downloadArgs.length - 1];
                const cloneToken = cloneArgs[cloneArgs.length - 1];
                const uploadToken = uploadArgs[uploadArgs.length - 1];

                expect(downloadToken).to.have.property('isCancellationRequested');
                expect(cloneToken).to.have.property('isCancellationRequested');
                expect(uploadToken).to.have.property('isCancellationRequested');
            });

            it('should skip all PAC calls when cancelled before download starts', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');
                const mockShowInfo = vscode.window.showInformationMessage as sinon.SinonStub;
                showProgressStub.callsFake(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    async (_title: string, _cancellable: boolean, task: (progress: any, token: any) => Promise<any>) => {
                        return task({ report: progressReportStub }, makeToken(true));
                    }
                );

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(mockPacWrapper.downloadSiteWithProgress.called).to.be.false;
                expect(mockPacWrapper.cloneSiteWithProgress.called).to.be.false;
                expect(mockPacWrapper.uploadSiteWithProgress.called).to.be.false;
                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_CANCELLED)).to.be.true;
                expect(mockShowInfo.calledWith(Constants.Strings.CLONE_SITE_CANCELLED)).to.be.true;
                expect(executeCommandStub.calledWith('microsoft.powerplatform.pages.actionsHub.refresh')).to.be.false;
            });

            it('should skip clone and upload when cancelled after download', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');
                const mockShowInfo = vscode.window.showInformationMessage as sinon.SinonStub;
                let downloadDone = false;

                const cancelToken: vscode.CancellationToken = {
                    // Becomes true only after the download step completes — so the
                    // handler runs `pac pages download` once and then bails.
                    get isCancellationRequested() { return downloadDone; },
                    onCancellationRequested: () => ({ dispose: () => { /* noop */ } }),
                } as unknown as vscode.CancellationToken;

                mockPacWrapper.downloadSiteWithProgress.callsFake((targetDir: string) => {
                    const siteFolder = path.join(targetDir, 'test-site');
                    fs.ensureDirSync(siteFolder);
                    fs.writeFileSync(path.join(siteFolder, 'website.yml'), 'adx_name: test-site');
                    downloadDone = true;
                    return Promise.resolve(true);
                });

                showProgressStub.callsFake(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    async (_title: string, _cancellable: boolean, task: (progress: any, token: any) => Promise<any>) => {
                        return task({ report: progressReportStub }, cancelToken);
                    }
                );

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(mockPacWrapper.downloadSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.cloneSiteWithProgress.called).to.be.false;
                expect(mockPacWrapper.uploadSiteWithProgress.called).to.be.false;
                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_CANCELLED)).to.be.true;
                expect(mockShowInfo.calledWith(Constants.Strings.CLONE_SITE_CANCELLED)).to.be.true;
            });

            it('should not emit failure telemetry or an error toast when cancelled', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');
                const mockShowError = sandbox.stub(vscode.window, 'showErrorMessage');
                showProgressStub.callsFake(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    async (_title: string, _cancellable: boolean, task: (progress: any, token: any) => Promise<any>) => {
                        return task({ report: progressReportStub }, makeToken(true));
                    }
                );

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                // Cancellation is not a failure — no error toast and no failure events.
                expect(mockShowError.called).to.be.false;
                expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_DOWNLOAD_FAILED)).to.be.false;
                expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_CLONE_SITE_FAILED)).to.be.false;
                expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_UPLOAD_CLONED_SITE_FAILED)).to.be.false;
            });
        });

        describe('progress notification', () => {
            it('should show a single progress notification with title "Clone site: <siteName>"', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem({ name: 'My Website' }));

                expect(showProgressStub.calledOnce).to.be.true;
                const title = showProgressStub.firstCall.args[0] as string;
                expect(title).to.equal(Constants.StringFunctions.CLONE_SITE_PROGRESS_TITLE('My Website'));
                expect(title).to.equal('Clone site: My Website');
                // The [details] link belongs in each step message (so it renders
                // at the end before the trailing ellipsis), not in the title.
                expect(title).to.not.include('[details]');
            });

            it('should report Downloading, Cloning, and Uploading-to-env messages in order', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                const reportedMessages = progressReportStub.getCalls().map(
                    call => (call.args[0] as { message: string }).message
                );
                expect(reportedMessages).to.deep.equal([
                    Constants.Strings.CLONE_SITE_DOWNLOADING,
                    Constants.Strings.CLONE_SITE_CLONING,
                    Constants.StringFunctions.UPLOADING_CLONED_SITE_TO_ENV('Test Environment'),
                ]);
                // The [details] link must appear at the end of each step (just
                // before the trailing ellipsis) so users can open the PAC output
                // channel from any step of the operation.
                for (const message of reportedMessages) {
                    expect(message).to.match(/\[details\]\(command:microsoft\.powerplatform\.pages\.actionsHub\.showOutputChannel[^)]*\)\)\.\.\.$/);
                }
            });

            it('should include the environment name in the upload step message', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                const lastReport = (progressReportStub.lastCall.args[0] as { message: string }).message;
                expect(lastReport).to.include("'Test Environment'");
                expect(lastReport).to.include('environment');
            });

            it('should fall back to a generic upload message when environment name is missing', async () => {
                // Replace the default AuthInfo stub set up in beforeEach.
                const authInfoStub = PacContext.AuthInfo as unknown as { restore?: () => void };
                if (authInfoStub && typeof authInfoStub.restore === 'function') {
                    authInfoStub.restore();
                }
                sandbox.stub(PacContext, 'AuthInfo').get(() => null);

                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                const lastReport = (progressReportStub.lastCall.args[0] as { message: string }).message;
                expect(lastReport).to.equal(Constants.Strings.CLONE_SITE_UPLOADING);
                expect(lastReport).to.not.include("''");
            });

            it('should fall back to a generic upload message when environment name is whitespace', async () => {
                const authInfoStub = PacContext.AuthInfo as unknown as { restore?: () => void };
                if (authInfoStub && typeof authInfoStub.restore === 'function') {
                    authInfoStub.restore();
                }
                sandbox.stub(PacContext, 'AuthInfo').get(() => ({ OrganizationFriendlyName: '   ' }));

                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                const lastReport = (progressReportStub.lastCall.args[0] as { message: string }).message;
                expect(lastReport).to.equal(Constants.Strings.CLONE_SITE_UPLOADING);
            });

            it('should not show any progress notification when the user cancels the name prompt', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(showProgressStub.called).to.be.false;
            });

            it('should not report later step messages once a step fails', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Copy of Test Site');
                sandbox.stub(vscode.window, 'showErrorMessage');
                mockPacWrapper.cloneSiteWithProgress.callsFake(() => Promise.resolve(false));

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                const reportedMessages = progressReportStub.getCalls().map(
                    call => (call.args[0] as { message: string }).message
                );
                // Should have reported Downloading and Cloning but not Uploading.
                expect(reportedMessages).to.deep.equal([
                    Constants.Strings.CLONE_SITE_DOWNLOADING,
                    Constants.Strings.CLONE_SITE_CLONING,
                ]);
            });
        });

        describe('when download succeeds but site folder not found', () => {
            it('should show error and not proceed to clone', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Clone Name');
                const mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');

                // Override download to NOT create a subfolder
                mockPacWrapper.downloadSiteWithProgress.callsFake(() => Promise.resolve(true));

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

                mockPacWrapper.downloadSiteWithProgress.callsFake(() => Promise.resolve(false));

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

                mockPacWrapper.cloneSiteWithProgress.callsFake(() => Promise.resolve(false));

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

            it('should offer a "Show Details" action on the error toast', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Clone Name');
                const mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage').resolves(undefined);

                mockPacWrapper.uploadSiteWithProgress.resolves(false);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.UPLOAD_CLONED_SITE_FAILED);
                expect(mockShowErrorMessage.firstCall.args[1]).to.equal(Constants.Strings.SHOW_DETAILS);
            });

            it('should open the PAC output channel when user clicks "Show Details"', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Clone Name');
                // Simulate the user selecting the Show Details action.
                sandbox.stub(vscode.window, 'showErrorMessage')
                    .resolves(Constants.Strings.SHOW_DETAILS as unknown as undefined);

                mockPacWrapper.uploadSiteWithProgress.resolves(false);

                const handler = cloneSite(mockPacTerminal as unknown as PacTerminal);
                await handler(createMockSiteTreeItem());

                // Yield once to let the fire-and-forget .then() run.
                await new Promise<void>((resolve) => setImmediate(resolve));

                expect(mockPacWrapper.showOutputChannel.calledOnce).to.be.true;
            });
        });

        describe('when an exception is thrown', () => {
            it('should catch the error and log telemetry', async () => {
                sandbox.stub(vscode.window, 'showInputBox').resolves('Clone Name');

                mockPacWrapper.downloadSiteWithProgress.callsFake(() => { throw new Error('Unexpected error'); });

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
