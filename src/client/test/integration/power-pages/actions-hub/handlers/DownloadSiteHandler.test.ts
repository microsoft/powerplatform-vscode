/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import path from 'path';
import { downloadSite } from '../../../../../power-pages/actions-hub/handlers/DownloadSiteHandler';
import { Constants } from '../../../../../power-pages/actions-hub/Constants';
import { PacTerminal } from '../../../../../lib/PacTerminal';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { IWebsiteInfo } from '../../../../../power-pages/actions-hub/models/IWebsiteInfo';
import CurrentSiteContext from '../../../../../power-pages/actions-hub/CurrentSiteContext';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('DownloadSiteHandler', () => {
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

    describe('downloadSite', () => {
        let dirnameSpy: sinon.SinonSpy;
        let mockSendText: sinon.SinonStub;

        beforeEach(() => {
            mockSendText = sinon.stub();
            dirnameSpy = sinon.spy(path, 'dirname');
            sinon.stub(PacTerminal, 'getTerminal').returns({ sendText: mockSendText } as unknown as vscode.Terminal);
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('when the site is current', () => {
            it('should download without asking for download path', async () => {
                sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => "D:/foo/bar");
                const mockSiteTreeItem = new SiteTreeItem({
                    isCurrent: true,
                    websiteId: 'test-id',
                    dataModelVersion: 2
                } as IWebsiteInfo);

                await downloadSite(mockSiteTreeItem);

                expect(dirnameSpy.calledOnce).to.be.true;
                expect(mockSendText.calledOnce).to.be.true;
                expect(mockSendText.firstCall.args[0]).to.equal('pac pages download --overwrite --path "D:/foo" --webSiteId test-id --modelVersion "2"');
            });
        });

        describe('when the site is not current', () => {
            describe('and there is no current site context', () => {
                beforeEach(() => {
                    sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => undefined);
                });

                it('should only show 1 option in download path quick pick', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');

                    await downloadSite(mockSiteTreeItem);

                    expect(mockQuickPick.calledOnce).to.be.true;
                    const options = mockQuickPick.firstCall.args[0] as { label: string, iconPath: vscode.ThemeIcon }[];
                    expect(options.length).to.equal(1);
                    expect(options[0].label).to.equal("Browse...");
                    expect(mockQuickPick.firstCall.args[1]).to.deep.equal({
                        canPickMany: false,
                        placeHolder: Constants.Strings.SELECT_DOWNLOAD_FOLDER
                    });
                });
            });

            describe('but there is a current site context', () => {
                beforeEach(() => {
                    sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => "D:/foo/bar");
                });

                it('should show 2 options in download path quick pick', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');

                    await downloadSite(mockSiteTreeItem);

                    expect(mockQuickPick.calledOnce).to.be.true;
                    const options = mockQuickPick.firstCall.args[0] as vscode.QuickPickItem[];
                    expect(options.length).to.equal(2);
                    expect(options[0].label).to.equal("Browse...");
                    expect(options[1].label).to.equal("D:/foo");
                    expect(mockQuickPick.firstCall.args[1]).to.deep.equal({
                        canPickMany: false,
                        placeHolder: Constants.Strings.SELECT_DOWNLOAD_FOLDER
                    });
                });

                it('should download when a path is selected', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
                    mockQuickPick.resolves({ label: "D:/foo" });

                    await downloadSite(mockSiteTreeItem);

                    expect(mockSendText.calledOnce).to.be.true;
                    expect(mockSendText.firstCall.args[0]).to.equal('pac pages download --overwrite --path "D:/foo" --webSiteId test-id --modelVersion "2"');
                });

                it('should show file open dialog when "Browse..." is selected', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
                    mockQuickPick.resolves({ label: "Browse..." });

                    const mockShowOpenDialog = sinon.stub(vscode.window, 'showOpenDialog');
                    mockShowOpenDialog.resolves([{ fsPath: "D:/foo" } as unknown as vscode.Uri]);

                    await downloadSite(mockSiteTreeItem);

                    expect(mockShowOpenDialog.calledOnce).to.be.true;
                    expect(mockShowOpenDialog.firstCall.args[0]).to.deep.equal({
                        canSelectFolders: true,
                        canSelectFiles: false,
                        openLabel: Constants.Strings.SELECT_FOLDER,
                        title: Constants.Strings.SELECT_DOWNLOAD_FOLDER
                    });
                });

                it('should download the site when a path is selected in the file open dialog', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
                    mockQuickPick.resolves({ label: "Browse..." });

                    const mockShowOpenDialog = sinon.stub(vscode.window, 'showOpenDialog');
                    mockShowOpenDialog.resolves([{ fsPath: "D:/foo" } as unknown as vscode.Uri]);

                    await downloadSite(mockSiteTreeItem);

                    expect(mockSendText.calledOnce).to.be.true;
                    expect(mockSendText.firstCall.args[0]).to.equal('pac pages download --overwrite --path "D:/foo" --webSiteId test-id --modelVersion "2"');
                });

                it('should not download the site when no path is selected in the file open dialog', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
                    mockQuickPick.resolves({ label: "Browse..." });

                    const mockShowOpenDialog = sinon.stub(vscode.window, 'showOpenDialog');
                    mockShowOpenDialog.resolves([]);

                    await downloadSite(mockSiteTreeItem);

                    expect(mockSendText.called).to.be.false;
                });
            });
        });
    });
});
