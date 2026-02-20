/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { runCodeQLScreening } from '../../../../../../power-pages/actions-hub/handlers/code-ql/RunCodeQlScreeningHandler';
import { Constants } from '../../../../../../power-pages/actions-hub/Constants';
import { SiteTreeItem } from '../../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { WebsiteStatus } from '../../../../../../power-pages/actions-hub/models/WebsiteStatus';
import { SiteVisibility } from '../../../../../../power-pages/actions-hub/models/SiteVisibility';
import CurrentSiteContext from '../../../../../../power-pages/actions-hub/CurrentSiteContext';
import * as Utils from '../../../../../../../common/utilities/Utils';
import { CODEQL_EXTENSION_ID } from '../../../../../../../common/constants';
import { CodeQLAction } from '../../../../../../power-pages/actions-hub/handlers/code-ql/CodeQLAction';
import * as TelemetryHelper from '../../../../../../power-pages/actions-hub/TelemetryHelper';

describe('RunCodeQlScreeningHandler', () => {
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

    describe('runCodeQLScreening', () => {
        let mockShowErrorMessage: sinon.SinonStub;
        let mockShowWarningMessage: sinon.SinonStub;
        let mockGetExtension: sinon.SinonStub;
        let mockShowProgressNotification: sinon.SinonStub;
        let mockExecuteCommand: sinon.SinonStub;
        let mockCodeQLAction: sinon.SinonStubbedInstance<CodeQLAction>;
        let mockSiteTreeItem: SiteTreeItem;

        beforeEach(() => {
            mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');
            mockShowWarningMessage = sandbox.stub(vscode.window, 'showWarningMessage');
            mockGetExtension = sandbox.stub(vscode.extensions, 'getExtension');
            mockExecuteCommand = sandbox.stub(vscode.commands, 'executeCommand');
            mockShowProgressNotification = sandbox.stub(Utils, 'showProgressWithNotification').callsFake(async (title: string, task: (progress: vscode.Progress<{
                message?: string;
                increment?: number;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }>) => Promise<any>) => await task({} as unknown as vscode.Progress<{ message?: string; increment?: number }>));

            // Mock CodeQLAction constructor and methods
            mockCodeQLAction = {
                executeCodeQLAnalysisWithCustomPath: sandbox.stub().resolves(),
                dispose: sandbox.stub()
            } as sinon.SinonStubbedInstance<CodeQLAction>;
            sandbox.stub(CodeQLAction.prototype, 'executeCodeQLAnalysisWithCustomPath').callsFake(mockCodeQLAction.executeCodeQLAnalysisWithCustomPath);

            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: SiteVisibility.Private,
                siteManagementUrl: "https://test-site-management.com",
                createdOn: "2025-03-20",
                creator: "Test Creator",
                isCodeSite: false
            });
        });

        it('should prompt to install CodeQL extension when not installed', async () => {
            mockGetExtension.returns(undefined);
            mockShowWarningMessage.resolves(Constants.Strings.INSTALL);
            sandbox.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => 'C:\\test\\site\\path');

            await runCodeQLScreening(mockSiteTreeItem);

            expect(mockGetExtension.calledWith(CODEQL_EXTENSION_ID)).to.be.true;
            expect(mockShowWarningMessage.calledWith(
                Constants.Strings.CODEQL_EXTENSION_NOT_INSTALLED,
                Constants.Strings.INSTALL,
                Constants.Strings.CANCEL
            )).to.be.true;
            expect(mockExecuteCommand.calledWith('workbench.extensions.installExtension', CODEQL_EXTENSION_ID)).to.be.true;
        });

        it('should show error when current site path not found', async () => {
            mockGetExtension.returns({ id: 'github.vscode-codeql' });
            sandbox.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => null);

            await runCodeQLScreening(mockSiteTreeItem);

            expect(mockShowErrorMessage.calledWith(Constants.Strings.CODEQL_CURRENT_SITE_PATH_NOT_FOUND)).to.be.true;
        });

        it('should create CodeQL database for current site when extension is installed', async () => {
            mockGetExtension.returns({ id: 'github.vscode-codeql' });
            sandbox.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => 'C:\\test\\site\\path');

            await runCodeQLScreening(mockSiteTreeItem);

            expect(mockShowProgressNotification.calledWith(Constants.Strings.CODEQL_SCREENING_STARTED)).to.be.true;
            expect(mockCodeQLAction.executeCodeQLAnalysisWithCustomPath.called).to.be.true;
        });

        it('should handle errors gracefully', async () => {
            mockGetExtension.returns({ id: 'github.vscode-codeql' });
            sandbox.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => 'C:\\test\\site\\path');
            mockShowProgressNotification.rejects(new Error('Test error'));

            await runCodeQLScreening(mockSiteTreeItem);

            expect(mockShowErrorMessage.calledWith(Constants.Strings.CODEQL_SCREENING_FAILED)).to.be.true;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_FAILED);
        });
    });
});
