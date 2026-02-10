/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { ActionsHubTreeDataProvider } from "../../../../power-pages/actions-hub/ActionsHubTreeDataProvider";
import { oneDSLoggerWrapper } from "../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { EnvironmentGroupTreeItem } from "../../../../power-pages/actions-hub/tree-items/EnvironmentGroupTreeItem";
import { OtherSitesGroupTreeItem } from "../../../../power-pages/actions-hub/tree-items/OtherSitesGroupTreeItem";
import { ToolsGroupTreeItem } from "../../../../power-pages/actions-hub/tree-items/ToolsGroupTreeItem";
import { ActionsHubTreeItem } from "../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { PacTerminal } from "../../../../lib/PacTerminal";
import { PacWrapper } from "../../../../pac/PacWrapper";
import { SUCCESS } from "../../../../../common/constants";
import { SiteTreeItem } from "../../../../power-pages/actions-hub/tree-items/SiteTreeItem";
import { IWebsiteInfo } from "../../../../power-pages/actions-hub/models/IWebsiteInfo";
import PacContext from "../../../../pac/PacContext";
import { CloudInstance, EnvironmentType } from "../../../../pac/PacTypes";
import { IOtherSiteInfo, IWebsiteDetails } from "../../../../../common/services/Interfaces";
import { Constants } from "../../../../power-pages/actions-hub/Constants";
import * as TelemetryHelper from "../../../../power-pages/actions-hub/TelemetryHelper";
import { AccountMismatchTreeItem } from "../../../../power-pages/actions-hub/tree-items/AccountMismatchTreeItem";
import * as AuthenticationProvider from "../../../../../common/services/AuthenticationProvider";
import * as ActionsHubUtils from "../../../../power-pages/actions-hub/ActionsHubUtils";
import * as RefreshEnvironmentHandler from "../../../../power-pages/actions-hub/handlers/RefreshEnvironmentHandler";
import * as SwitchEnvironmentHandler from "../../../../power-pages/actions-hub/handlers/SwitchEnvironmentHandler";
import * as ShowEnvironmentDetailsHandler from "../../../../power-pages/actions-hub/handlers/ShowEnvironmentDetailsHandler";
import * as OpenSiteInStudioHandler from "../../../../power-pages/actions-hub/handlers/OpenSiteInStudioHandler";
import * as PreviewSiteHandler from "../../../../power-pages/actions-hub/handlers/PreviewSiteHandler";
import * as ClearCacheHandler from "../../../../power-pages/actions-hub/handlers/ClearCacheHandler";
import * as CreateNewAuthProfileHandler from "../../../../power-pages/actions-hub/handlers/CreateNewAuthProfileHandler";
import * as RevealInOSHandler from "../../../../power-pages/actions-hub/handlers/RevealInOSHandler";
import * as OpenSiteManagementHandler from "../../../../power-pages/actions-hub/handlers/OpenSiteManagementHandler";
import * as UploadSiteHandler from "../../../../power-pages/actions-hub/handlers/UploadSiteHandler";
import * as ShowSiteDetailsHandler from "../../../../power-pages/actions-hub/handlers/ShowSiteDetailsHandler";
import * as DownloadSiteHandler from "../../../../power-pages/actions-hub/handlers/DownloadSiteHandler";
import * as LoginToMatchHandler from "../../../../power-pages/actions-hub/handlers/LoginToMatchHandler";
import * as RunCodeQLScreeningHandler from "../../../../power-pages/actions-hub/handlers/code-ql/RunCodeQlScreeningHandler";
import * as SortModeHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/SortModeHandler";
import * as ToggleViewModeHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/ToggleViewModeHandler";
import * as CompareWithLocalHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/CompareWithLocalHandler";
import * as CompareWithEnvironmentHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/CompareWithEnvironmentHandler";
import * as OpenMetadataDiffFileHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/OpenMetadataDiffFileHandler";
import * as OpenAllMetadataDiffsHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/OpenAllMetadataDiffsHandler";
import * as ClearMetadataDiffHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/ClearMetadataDiffHandler";
import * as RemoveSiteHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/RemoveSiteHandler";
import * as DiscardLocalChangesHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/DiscardLocalChangesHandler";
import * as DiscardFolderChangesHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/DiscardFolderChangesHandler";
import * as DiscardSiteChangesHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/DiscardSiteChangesHandler";
import * as GenerateHtmlReportHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/GenerateHtmlReportHandler";
import * as ExportMetadataDiffHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/ExportMetadataDiffHandler";
import * as ImportMetadataDiffHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler";
import * as ResyncMetadataDiffHandler from "../../../../power-pages/actions-hub/handlers/metadata-diff/ResyncMetadataDiffHandler";
import { ActionsHub } from "../../../../power-pages/actions-hub/ActionsHub";
import ArtemisContext from "../../../../ArtemisContext";
import { ServiceEndpointCategory } from "../../../../../common/services/Constants";
import { IArtemisAPIOrgResponse } from "../../../../../common/services/Interfaces";

// Add global type declaration for ArtemisContext
describe("ActionsHubTreeDataProvider", () => {
    let context: vscode.ExtensionContext;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
    let pacTerminal: PacTerminal;
    let pacWrapperStub: sinon.SinonStubbedInstance<PacWrapper>;
    let registerCommandStub: sinon.SinonStub;

    const mockAuthInfo = {
        UserType: 'user-type',
        Cloud: CloudInstance.Preprod,
        TenantId: 'test-tenant',
        TenantCountry: 'tenant-country',
        User: 'user',
        EntraIdObjectId: 'test-object-id',
        Puid: 'test-puid',
        UserCountryRegion: 'user-country-region',
        TokenExpires: 'token-expires',
        Authority: 'authority',
        EnvironmentGeo: 'test-geo',
        EnvironmentId: 'test-env-id',
        EnvironmentType: EnvironmentType.Regular,
        OrganizationId: 'test-org-id',
        OrganizationUniqueName: 'test-org-name',
        OrganizationFriendlyName: 'test-org-friendly-name'
    };

    beforeEach(() => {
        registerCommandStub = sinon.stub(vscode.commands, "registerCommand");
        context = {
            extensionUri: vscode.Uri.parse("https://localhost:3000"),
            globalState: {
                get: sinon.stub().returns(undefined),
                update: sinon.stub().resolves()
            }
        } as unknown as vscode.ExtensionContext;
        traceInfoStub = sinon.stub();
        traceErrorStub = sinon.stub();
        sinon.stub(oneDSLoggerWrapper, "getLogger").returns({
            traceInfo: traceInfoStub,
            traceWarning: sinon.stub(),
            traceError: traceErrorStub,
            featureUsage: sinon.stub()
        });
        pacTerminal = sinon.createStubInstance(PacTerminal);
        pacWrapperStub = sinon.createStubInstance(PacWrapper);
        pacWrapperStub.activeAuth.resolves({ Status: SUCCESS, Results: [], Errors: [], Information: [] });
        (pacTerminal.getWrapper as sinon.SinonStub).returns(pacWrapperStub);
        sinon.stub(TelemetryHelper, 'getBaseEventInfo').returns({
            testMetric: "foo"
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('initialize', () => {
        it("should register refresh command", async () => {
            const mockCommandHandler = sinon.stub(RefreshEnvironmentHandler, 'refreshEnvironment');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.refresh")).to.be.true;

            await registerCommandStub.getCall(0).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register switchEnvironment command", async () => {
            const mockCommandHandler = sinon.stub(SwitchEnvironmentHandler, 'switchEnvironment');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.switchEnvironment")).to.be.true;

            await registerCommandStub.getCall(1).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register showEnvironmentDetails command", async () => {
            const mockCommandHandler = sinon.stub(ShowEnvironmentDetailsHandler, 'showEnvironmentDetails');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.showEnvironmentDetails")).to.be.true;

            await registerCommandStub.getCall(2).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register openActiveSitesInStudio command", async () => {
            const mockCommandHandler = sinon.stub(OpenSiteInStudioHandler, 'openActiveSitesInStudio');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.openActiveSitesInStudio")).to.be.true;

            await registerCommandStub.getCall(3).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register openInactiveSitesInStudio command", async () => {
            const mockCommandHandler = sinon.stub(OpenSiteInStudioHandler, 'openInactiveSitesInStudio');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.openInactiveSitesInStudio")).to.be.true;

            await registerCommandStub.getCall(4).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register preview command", async () => {
            const mockCommandHandler = sinon.stub(PreviewSiteHandler, 'previewSite');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.preview")).to.be.true;

            await registerCommandStub.getCall(5).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register clearCache command", async () => {
            const mockCommandHandler = sinon.stub(ClearCacheHandler, 'clearCache');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.clearCache")).to.be.true;

            await registerCommandStub.getCall(6).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register newAuthProfile command", async () => {
            const mockCommandHandler = sinon.stub(CreateNewAuthProfileHandler, 'createNewAuthProfile');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.newAuthProfile")).to.be.true;

            await registerCommandStub.getCall(7).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register revealInOS commands", async () => {
            const mockCommandHandler = sinon.stub(RevealInOSHandler, 'revealInOS');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.windows")).to.be.true;
            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.mac")).to.be.true;
            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.linux")).to.be.true;

            await registerCommandStub.getCall(8).args[1]();
            await registerCommandStub.getCall(9).args[1]();
            await registerCommandStub.getCall(10).args[1]();
            expect(mockCommandHandler.calledThrice).to.be.true;
        });

        it("should register openSiteManagement commands", async () => {
            const mockCommandHandler = sinon.stub(OpenSiteManagementHandler, 'openSiteManagement');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.inactiveSite.openSiteManagement")).to.be.true;

            await registerCommandStub.getCall(11).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        //command "microsoft.powerplatform.pages.actionsHub.activeSite.uploadSite"
        it("should register uploadSite command", async () => {
            const mockCommandHandler = sinon.stub(UploadSiteHandler, 'uploadSite');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.uploadSite")).to.be.true;

            await registerCommandStub.getCall(12).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register siteDetails command", async () => {
            const mockCommandHandler = sinon.stub(ShowSiteDetailsHandler, 'showSiteDetails');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.siteDetails")).to.be.true;

            await registerCommandStub.getCall(13).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register downloadSite command", async () => {
            const mockCommandHandler = sinon.stub(DownloadSiteHandler, 'downloadSite');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.downloadSite")).to.be.true;

            await registerCommandStub.getCall(14).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it('should register openSiteInStudio command', async () => {
            const mockCommandHandler = sinon.stub(OpenSiteInStudioHandler, 'openSiteInStudio');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.openInStudio")).to.be.true;

            await registerCommandStub.getCall(15).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register loginToMatch command", async () => {
            const mockCommandHandler = sinon.stub(LoginToMatchHandler, 'loginToMatch');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.loginToMatch")).to.be.true;

            // Test the command handler with a proper context
            const commandHandler = registerCommandStub.getCalls().find(call =>
                call.args[0] === "microsoft.powerplatform.pages.actionsHub.loginToMatch"
            )?.args[1];

            if (commandHandler) {
                await commandHandler();
                expect(mockCommandHandler.calledOnce).to.be.true;
            }
        });

        it('should register runCodeQLScreening command', async () => {
            const mockCommandHandler = sinon.stub(RunCodeQLScreeningHandler, 'runCodeQLScreening');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, true);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.currentActiveSite.runCodeQLScreening")).to.be.true;

            // Find the CodeQL command in the registered commands
            const codeQLCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === "microsoft.powerplatform.pages.actionsHub.currentActiveSite.runCodeQLScreening"
            );

            if (codeQLCall) {
                await codeQLCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("CodeQL command was not registered");
            }
        });

        it('should register sortByName command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(SortModeHandler, 'sortByName');
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_SORT_BY_NAME)).to.be.true;

            const sortByNameCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_SORT_BY_NAME
            );

            if (sortByNameCall) {
                sortByNameCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("sortByName command was not registered");
            }
        });

        it('should register sortByPath command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(SortModeHandler, 'sortByPath');
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_SORT_BY_PATH)).to.be.true;

            const sortByPathCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_SORT_BY_PATH
            );

            if (sortByPathCall) {
                sortByPathCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("sortByPath command was not registered");
            }
        });

        it('should register sortByStatus command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(SortModeHandler, 'sortByStatus');
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_SORT_BY_STATUS)).to.be.true;

            const sortByStatusCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_SORT_BY_STATUS
            );

            if (sortByStatusCall) {
                sortByStatusCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("sortByStatus command was not registered");
            }
        });

        it('should register viewAsTree command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(ToggleViewModeHandler, 'viewAsTree');
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_VIEW_AS_TREE)).to.be.true;

            const viewAsTreeCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_VIEW_AS_TREE
            );

            if (viewAsTreeCall) {
                viewAsTreeCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("viewAsTree command was not registered");
            }
        });

        it('should register viewAsList command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(ToggleViewModeHandler, 'viewAsList');
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_VIEW_AS_LIST)).to.be.true;

            const viewAsListCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_VIEW_AS_LIST
            );

            if (viewAsListCall) {
                viewAsListCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("viewAsList command was not registered");
            }
        });

        it('should register compareWithLocal command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const innerHandler = sinon.stub();
            sinon.stub(CompareWithLocalHandler, 'compareWithLocal').returns(innerHandler);
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.compareWithLocal")).to.be.true;

            const compareWithLocalCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === "microsoft.powerplatform.pages.actionsHub.activeSite.compareWithLocal"
            );

            if (compareWithLocalCall) {
                expect(compareWithLocalCall.args[1]).to.equal(innerHandler);
            } else {
                throw new Error("compareWithLocal command was not registered");
            }
        });

        it('should register compareWithEnvironment command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const innerHandler = sinon.stub();
            sinon.stub(CompareWithEnvironmentHandler, 'compareWithEnvironment').returns(innerHandler);
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.COMPARE_WITH_ENVIRONMENT)).to.be.true;

            const compareWithEnvironmentCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.COMPARE_WITH_ENVIRONMENT
            );

            if (compareWithEnvironmentCall) {
                expect(compareWithEnvironmentCall.args[1]).to.equal(innerHandler);
            } else {
                throw new Error("compareWithEnvironment command was not registered");
            }
        });

        it('should register openMetadataDiffFile command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(OpenMetadataDiffFileHandler, 'openMetadataDiffFile');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_OPEN_FILE)).to.be.true;

            const openFileCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_OPEN_FILE
            );

            if (openFileCall) {
                await openFileCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("openMetadataDiffFile command was not registered");
            }
        });

        it('should register openAllMetadataDiffs command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(OpenAllMetadataDiffsHandler, 'openAllMetadataDiffs');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_OPEN_ALL)).to.be.true;

            const openAllCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_OPEN_ALL
            );

            if (openAllCall) {
                await openAllCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("openAllMetadataDiffs command was not registered");
            }
        });

        it('should register clearMetadataDiff command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(ClearMetadataDiffHandler, 'clearMetadataDiff');
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_CLEAR)).to.be.true;

            const clearCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_CLEAR
            );

            if (clearCall) {
                clearCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("clearMetadataDiff command was not registered");
            }
        });

        it('should register removeSiteComparison command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(RemoveSiteHandler, 'removeSiteComparison');
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_REMOVE_SITE)).to.be.true;

            const removeSiteCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_REMOVE_SITE
            );

            if (removeSiteCall) {
                removeSiteCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("removeSiteComparison command was not registered");
            }
        });

        it('should register discardLocalChanges command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(DiscardLocalChangesHandler, 'discardLocalChanges');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_DISCARD_FILE)).to.be.true;

            const discardFileCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_DISCARD_FILE
            );

            if (discardFileCall) {
                await discardFileCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("discardLocalChanges command was not registered");
            }
        });

        it('should register discardFolderChanges command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(DiscardFolderChangesHandler, 'discardFolderChanges');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_DISCARD_FOLDER)).to.be.true;

            const discardFolderCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_DISCARD_FOLDER
            );

            if (discardFolderCall) {
                await discardFolderCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("discardFolderChanges command was not registered");
            }
        });

        it('should register discardSiteChanges command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(DiscardSiteChangesHandler, 'discardSiteChanges');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_DISCARD_SITE)).to.be.true;

            const discardSiteCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_DISCARD_SITE
            );

            if (discardSiteCall) {
                await discardSiteCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("discardSiteChanges command was not registered");
            }
        });

        it('should register generateHtmlReport command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(GenerateHtmlReportHandler, 'generateHtmlReport');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_GENERATE_HTML_REPORT)).to.be.true;

            const generateHtmlReportCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_GENERATE_HTML_REPORT
            );

            if (generateHtmlReportCall) {
                await generateHtmlReportCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("generateHtmlReport command was not registered");
            }
        });

        it('should register exportMetadataDiff command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(ExportMetadataDiffHandler, 'exportMetadataDiff');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_EXPORT)).to.be.true;

            const exportCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_EXPORT
            );

            if (exportCall) {
                await exportCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("exportMetadataDiff command was not registered");
            }
        });

        it('should register importMetadataDiff command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const mockCommandHandler = sinon.stub(ImportMetadataDiffHandler, 'importMetadataDiff');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_IMPORT)).to.be.true;

            const importCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_IMPORT
            );

            if (importCall) {
                await importCall.args[1]();
                expect(mockCommandHandler.calledOnce).to.be.true;
            } else {
                throw new Error("importMetadataDiff command was not registered");
            }
        });

        it('should register resyncMetadataDiff command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const innerHandler = sinon.stub();
            sinon.stub(ResyncMetadataDiffHandler, 'resyncMetadataDiff').returns(innerHandler);
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith(Constants.Commands.METADATA_DIFF_RESYNC)).to.be.true;

            const resyncCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === Constants.Commands.METADATA_DIFF_RESYNC
            );

            if (resyncCall) {
                expect(resyncCall.args[1]).to.equal(innerHandler);
            } else {
                throw new Error("resyncMetadataDiff command was not registered");
            }
        });

        it('should register showOutputChannel command', async () => {
            sinon.stub(ActionsHub, 'isMetadataDiffEnabled').returns(true);
            const showOutputChannelStub = sinon.stub();
            (pacTerminal.getWrapper as sinon.SinonStub).returns({
                ...pacWrapperStub,
                showOutputChannel: showOutputChannelStub
            });
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.showOutputChannel")).to.be.true;

            const showOutputCall = registerCommandStub.getCalls().find(call =>
                call.args[0] === "microsoft.powerplatform.pages.actionsHub.showOutputChannel"
            );

            if (showOutputCall) {
                showOutputCall.args[1]();
                expect(showOutputChannelStub.calledOnce).to.be.true;
            } else {
                throw new Error("showOutputChannel command was not registered");
            }
        });
    });

    describe('getTreeItem', () => {
        it("should return the element in getTreeItem", () => {
            const element = {} as ActionsHubTreeItem;
            const result = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false).getTreeItem(element);
            expect(result).to.equal(element);
        });
    });

    describe('getChildren', () => {
        it('should call traceInfo', async () => {
            const mockActiveSites = [
                { name: "Foo", websiteRecordId: 'foo', websiteUrl: "https://foo.com" }
            ] as IWebsiteDetails[];
            const mockInactiveSites = [
                { name: "Bar", websiteRecordId: 'Bar', websiteUrl: "https://bar.com" }
            ] as IWebsiteDetails[];
            const otherSites = [
                { name: "Baz", websiteId: 'baz' }
            ] as IOtherSiteInfo[];
            sinon.stub(ActionsHubUtils, 'fetchWebsites').resolves({ activeSites: mockActiveSites, inactiveSites: mockInactiveSites, otherSites: otherSites });

            PacContext['_authInfo'] = null;
            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            await provider.getChildren();

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_TREE_GET_CHILDREN_CALLED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({ methodName: provider.getChildren.name, testMetric: "foo" });
        });

        it("should return empty array when no auth is available", async () => {
            const mockActiveSites = [
                { name: "Foo", websiteRecordId: 'foo', websiteUrl: "https://foo.com" }
            ] as IWebsiteDetails[];
            const mockInactiveSites = [
                { name: "Bar", websiteRecordId: 'Bar', websiteUrl: "https://bar.com" }
            ] as IWebsiteDetails[];
            const otherSites = [
                { name: "Baz", websiteId: 'baz' }
            ] as IOtherSiteInfo[];
            sinon.stub(ActionsHubUtils, 'fetchWebsites').resolves({ activeSites: mockActiveSites, inactiveSites: mockInactiveSites, otherSites: otherSites });

            PacContext['_authInfo'] = null;
            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            const result = await provider.getChildren();

            expect(result).to.not.be.null;
            expect(result).to.not.be.undefined;
            expect(result).to.have.lengthOf(0);
        });

        it("should return environment and other sites group tree items when auth info and Artemis context are available", async () => {
            const mockActiveSites = [
                { name: "Foo", websiteRecordId: 'foo', websiteUrl: "https://foo.com" }
            ] as IWebsiteDetails[];
            const mockInactiveSites = [
                { name: "Bar", websiteRecordId: 'Bar', websiteUrl: "https://bar.com" }
            ] as IWebsiteDetails[];
            const otherSites = [
                { name: "Baz", websiteId: 'baz' }
            ] as IOtherSiteInfo[];
            sinon.stub(ActionsHubUtils, 'fetchWebsites').resolves({ activeSites: mockActiveSites, inactiveSites: mockInactiveSites, otherSites: otherSites });
            sinon.stub(vscode.authentication, 'getSession').resolves({ accessToken: 'foo' } as vscode.AuthenticationSession);
            sinon.stub(AuthenticationProvider, 'getOIDFromToken').returns('matching-user-id');

            sinon.stub(PacContext, "AuthInfo").get(() => ({
                OrganizationFriendlyName: "TestOrg",
                UserType: "",
                Cloud: CloudInstance.Preprod,
                TenantId: "",
                TenantCountry: "",
                User: "",
                EntraIdObjectId: "matching-user-id",
                Puid: "",
                UserCountryRegion: "",
                TokenExpires: "",
                Authority: "",
                EnvironmentGeo: "",
                EnvironmentId: "test-env-id",
                EnvironmentType: EnvironmentType.Regular,
                OrganizationId: "",
                OrganizationUniqueName: ""
            }));

            sinon.stub(PacContext, "OrgInfo").get(() => ({
                EnvironmentId: "test-env-id"
            }));

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);

            const result = await provider.getChildren();

            expect(result).to.not.be.null;
            expect(result).to.not.be.undefined;
            expect(result).to.have.lengthOf(3);
            expect(result![0]).to.be.instanceOf(EnvironmentGroupTreeItem);
            expect(result![1]).to.be.instanceOf(OtherSitesGroupTreeItem);
            expect(result![2]).to.be.instanceOf(ToolsGroupTreeItem);

            const environmentGroup = result![0] as EnvironmentGroupTreeItem;
            expect(environmentGroup.environmentInfo.currentEnvironmentName).to.equal("TestOrg");
            expect(environmentGroup['_activeSites']).to.deep.equal(mockActiveSites);
            expect(environmentGroup['_inactiveSites']).to.deep.equal(mockInactiveSites);
        });

        it("should return empty array when auth info is not available", async () => {
            sinon.stub(PacContext, "AuthInfo").get(() => null);

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            provider["_loadWebsites"] = false;
            const result = await provider.getChildren();

            expect(result).to.be.an('array').that.is.empty;
        });

        it("should return empty array when VS Code auth is not available", async () => {
            sinon.stub(PacContext, "AuthInfo").get(() => ({ OrganizationFriendlyName: 'Foo Bar' }));
            sinon.stub(vscode.authentication, 'getSession').resolves({ accessToken: '' } as vscode.AuthenticationSession);

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            provider["_loadWebsites"] = false;
            const result = await provider.getChildren();

            expect(result).to.be.an('array').that.is.empty;
        });

        it("should call element.getChildren when an element is passed", async () => {
            const element = new SiteTreeItem({} as IWebsiteInfo);
            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            sinon.stub(ActionsHubUtils, 'fetchWebsites').resolves({ activeSites: [], inactiveSites: [], otherSites: [] });
            provider["_loadWebsites"] = false;
            const getChildrenStub = sinon.stub(element, "getChildren").resolves([]);

            const result = await provider.getChildren(element);

            expect(getChildrenStub.calledOnce).to.be.true;
            expect(result).to.deep.equal([]);
        });

        it('should load websites when it is first load', async () => {
            const mockActiveSites = [
                { name: "Foo", websiteRecordId: 'foo', websiteUrl: "https://foo.com" }
            ] as IWebsiteDetails[];
            const mockInactiveSites = [
                { name: "Bar", websiteRecordId: 'Bar', websiteUrl: "https://bar.com" }
            ] as IWebsiteDetails[];
            const otherSites = [
                { name: "Baz", websiteId: 'baz' }
            ] as IOtherSiteInfo[];
            const mockFetchWebsites = sinon.stub(ActionsHubUtils, 'fetchWebsites').resolves({ activeSites: mockActiveSites, inactiveSites: mockInactiveSites, otherSites: otherSites });
            sinon.stub(vscode.authentication, 'getSession').resolves({ accessToken: 'foo' } as vscode.AuthenticationSession);
            sinon.stub(AuthenticationProvider, 'getOIDFromToken').returns('matching-user-id');

            PacContext['_authInfo'] = {
                OrganizationFriendlyName: "TestOrg",
                UserType: "",
                Cloud: CloudInstance.Preprod,
                TenantId: "",
                TenantCountry: "",
                User: "",
                EntraIdObjectId: "matching-user-id",
                Puid: "",
                UserCountryRegion: "",
                TokenExpires: "",
                Authority: "",
                EnvironmentGeo: "",
                EnvironmentId: "",
                EnvironmentType: EnvironmentType.Regular,
                OrganizationId: "",
                OrganizationUniqueName: ""
            };
            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            provider["_loadWebsites"] = true;

            await provider.getChildren();

            expect(mockFetchWebsites.calledOnce).to.be.true;
        });
    });

    describe('checkAccountsMatch', () => {
        let getSessionStub: sinon.SinonStub;
        let getOIDFromTokenStub: sinon.SinonStub;

        beforeEach(() => {
            getSessionStub = sinon.stub(vscode.authentication, 'getSession');
            getOIDFromTokenStub = sinon.stub(AuthenticationProvider, 'getOIDFromToken');
        });

        it('should return false when no VS Code session exists', async () => {
            getSessionStub.resolves(null);
            PacContext['_authInfo'] = mockAuthInfo;

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            const result = await provider['checkAccountsMatch']();

            expect(result).to.be.false;
            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_ACCOUNT_CHECK_CALLED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                result: 'missing_session_or_auth',
                hasSession: false,
                hasAccessToken: false,
                hasPacAuthInfo: true
            });
        });

        it('should return false when VS Code session has no access token', async () => {
            getSessionStub.resolves({ accessToken: '' } as vscode.AuthenticationSession);
            PacContext['_authInfo'] = mockAuthInfo;

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            const result = await provider['checkAccountsMatch']();

            expect(result).to.be.false;
            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_ACCOUNT_CHECK_CALLED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                result: 'missing_session_or_auth',
                hasSession: true,
                hasAccessToken: false,
                hasPacAuthInfo: true
            });
        });

        it('should return false when PAC auth info is missing', async () => {
            getSessionStub.resolves({ accessToken: 'valid-token' } as vscode.AuthenticationSession);
            PacContext['_authInfo'] = null;

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            const result = await provider['checkAccountsMatch']();

            expect(result).to.be.false;
            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_ACCOUNT_CHECK_CALLED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                result: 'missing_session_or_auth',
                hasSession: true,
                hasAccessToken: true,
                hasPacAuthInfo: false
            });
        });

        it('should return false when accounts do not match', async () => {
            const mockSession = { accessToken: 'valid-token' } as vscode.AuthenticationSession;
            getSessionStub.resolves(mockSession);
            getOIDFromTokenStub.returns('vscode-user-id');

            PacContext['_authInfo'] = {
                ...mockAuthInfo,
                EntraIdObjectId: 'pac-user-id' // Different from VS Code user ID
            };

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            const result = await provider['checkAccountsMatch']();

            expect(result).to.be.false;
            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_ACCOUNT_MISMATCH_DETECTED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                vscodeUserId: 'vscode-user-id',
                pacUserId: 'pac-user-id'
            });
        });

        it('should return true when accounts match', async () => {
            const mockSession = { accessToken: 'valid-token' } as vscode.AuthenticationSession;
            getSessionStub.resolves(mockSession);
            getOIDFromTokenStub.returns('same-user-id');

            PacContext['_authInfo'] = {
                ...mockAuthInfo,
                EntraIdObjectId: 'same-user-id' // Same as VS Code user ID
            };

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            const result = await provider['checkAccountsMatch']();

            expect(result).to.be.true;
            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_ACCOUNT_MATCH_RESOLVED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                vscodeUserIdLength: 12, // length of 'same-user-id'
                pacUserIdLength: 12
            });
        });

        it('should return false when getOIDFromToken fails for VS Code token', async () => {
            const mockSession = { accessToken: 'invalid-token' } as vscode.AuthenticationSession;
            getSessionStub.resolves(mockSession);
            getOIDFromTokenStub.returns(null); // Simulates token parsing failure

            PacContext['_authInfo'] = {
                ...mockAuthInfo,
                EntraIdObjectId: 'pac-user-id'
            };

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            const result = await provider['checkAccountsMatch']();

            expect(result).to.be.false;
            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_ACCOUNT_MISMATCH_DETECTED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                vscodeUserId: 'undefined',
                pacUserId: 'pac-user-id'
            });
        });

        it('should return false when PAC EntraIdObjectId is missing', async () => {
            const mockSession = { accessToken: 'valid-token' } as vscode.AuthenticationSession;
            getSessionStub.resolves(mockSession);
            getOIDFromTokenStub.returns('vscode-user-id');

            PacContext['_authInfo'] = {
                ...mockAuthInfo,
                EntraIdObjectId: '' // Missing PAC user ID
            };

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            const result = await provider['checkAccountsMatch']();

            expect(result).to.be.false;
            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_ACCOUNT_MISMATCH_DETECTED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                vscodeUserId: 'vscode-user-id',
                pacUserId: 'undefined'
            });
        });

        it('should handle errors and trace them', async () => {
            const authError = new Error('Authentication error');
            getSessionStub.rejects(authError);
            PacContext['_authInfo'] = mockAuthInfo;

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            const result = await provider['checkAccountsMatch']();

            expect(result).to.be.false;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_ACCOUNT_CHECK_FAILED);
            expect(traceErrorStub.firstCall.args[2]).to.equal(authError);
            expect(traceErrorStub.firstCall.args[3]).to.deep.include({
                methodName: 'checkAccountsMatch',
                errorType: 'Error'
            });
        });
    });

    describe('getChildren with account mismatch', () => {
        let getSessionStub: sinon.SinonStub;
        let getOIDFromTokenStub: sinon.SinonStub;

        beforeEach(() => {
            getSessionStub = sinon.stub(vscode.authentication, 'getSession');
            getOIDFromTokenStub = sinon.stub(AuthenticationProvider, 'getOIDFromToken');
        });

        it('should return AccountMismatchTreeItem when accounts do not match', async () => {
            const mockSession = { accessToken: 'valid-token' } as vscode.AuthenticationSession;
            getSessionStub.resolves(mockSession);
            getOIDFromTokenStub.returns('vscode-user-id');

            PacContext['_authInfo'] = {
                ...mockAuthInfo,
                OrganizationFriendlyName: "TestOrg",
                EntraIdObjectId: 'pac-user-id' // Different from VS Code user ID
            };

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            provider["_loadWebsites"] = false; // Skip website loading for this test

            const result = await provider.getChildren();

            expect(result).to.not.be.null;
            expect(result).to.not.be.undefined;
            expect(result).to.have.lengthOf(1);
            expect(result![0]).to.be.instanceOf(AccountMismatchTreeItem);

            // Verify telemetry was called for account mismatch
            expect(traceInfoStub.callCount).to.be.greaterThan(1);
            const accountMismatchCall = traceInfoStub.getCalls().find(call =>
                call.args[0] === Constants.EventNames.ACTIONS_HUB_ACCOUNT_MISMATCH_DETECTED
            );
            expect(accountMismatchCall).to.not.be.undefined;
        });

        it('should return normal environment tree when accounts match', async () => {
            const mockSession = { accessToken: 'valid-token' } as vscode.AuthenticationSession;
            getSessionStub.resolves(mockSession);
            getOIDFromTokenStub.returns('same-user-id');

            const mockActiveSites = [
                { name: "Foo", websiteRecordId: 'foo', websiteUrl: "https://foo.com" }
            ] as IWebsiteDetails[];
            const mockInactiveSites = [
                { name: "Bar", websiteRecordId: 'Bar', websiteUrl: "https://bar.com" }
            ] as IWebsiteDetails[];
            const otherSites = [
                { name: "Baz", websiteId: 'baz' }
            ] as IOtherSiteInfo[];

            sinon.stub(ActionsHubUtils, 'fetchWebsites').resolves({
                activeSites: mockActiveSites,
                inactiveSites: mockInactiveSites,
                otherSites: otherSites
            });

            PacContext['_authInfo'] = {
                ...mockAuthInfo,
                OrganizationFriendlyName: "TestOrg",
                EntraIdObjectId: 'same-user-id' // Same as VS Code user ID
            };

            sinon.stub(PacContext, "OrgInfo").get(() => ({
                EnvironmentId: "test-env-id"
            }));

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);

            const result = await provider.getChildren();

            expect(result).to.not.be.null;
            expect(result).to.not.be.undefined;
            expect(result).to.have.lengthOf(3); // EnvironmentGroupTreeItem, OtherSitesGroupTreeItem, and ToolsGroupTreeItem
            expect(result![0]).to.be.instanceOf(EnvironmentGroupTreeItem);
            expect(result![1]).to.be.instanceOf(OtherSitesGroupTreeItem);
            expect(result![2]).to.be.instanceOf(ToolsGroupTreeItem);

            // Verify telemetry was called for successful account check
            expect(traceInfoStub.called).to.be.true;
            const accountMatchCall = traceInfoStub.getCalls().find(call =>
                call.args[0] === Constants.EventNames.ACTIONS_HUB_ACCOUNT_MATCH_RESOLVED
            );
            expect(accountMatchCall).to.not.be.undefined;
            if (accountMatchCall) {
                expect(accountMatchCall.args[1]).to.deep.include({
                    methodName: 'checkAccountsMatch'
                });
            }
        });
    });

    describe('preAuthenticateForWebsites', () => {
        beforeEach(async () => {
            // Reset ArtemisContext before each test
            ArtemisContext.setContext({
                stamp: ServiceEndpointCategory.PROD,
                response: {
                    geoName: 'us',
                    environment: 'prod',
                    clusterNumber: '1',
                    geoLongName: 'United States',
                    clusterCategory: 'test-category',
                    clusterName: 'test-cluster',
                    clusterType: 'test-type'
                }
            });
        });

        it('should skip pre-authentication when OrgInfo is missing', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            sinon.stub(PacContext, "OrgInfo").get(() => null);

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            await provider['preAuthenticateForWebsites']();

            expect(traceInfoStub.called).to.be.true;
            const preAuthSkippedCall = traceInfoStub.getCalls().find(call =>
                call.args[0] === Constants.EventNames.ACTIONS_HUB_PRE_AUTH_SKIPPED
            );
            expect(preAuthSkippedCall).to.not.be.undefined;
            if (preAuthSkippedCall) {
                expect(preAuthSkippedCall.args[1]).to.deep.include({
                    reason: 'missing_org_or_endpoint',
                    hasOrgInfo: false,
                    hasServiceEndpoint: true
                });
            }
        });

        it('should skip pre-authentication when ServiceEndpoint is missing', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            sinon.stub(PacContext, "OrgInfo").get(() => ({
                EnvironmentId: "test-env-id",
                OrgUrl: "https://test.crm.dynamics.com"
            }));

            // Clear ArtemisContext
            ArtemisContext.setContext({
                stamp: null as unknown as ServiceEndpointCategory,
                response: null as unknown as IArtemisAPIOrgResponse
            });

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            await provider['preAuthenticateForWebsites']();

            expect(traceInfoStub.called).to.be.true;
            const preAuthSkippedCall = traceInfoStub.getCalls().find(call =>
                call.args[0] === Constants.EventNames.ACTIONS_HUB_PRE_AUTH_SKIPPED
            );
            expect(preAuthSkippedCall).to.not.be.undefined;
            if (preAuthSkippedCall) {
                expect(preAuthSkippedCall.args[1]).to.deep.include({
                    reason: 'missing_org_or_endpoint',
                    hasOrgInfo: true,
                    hasServiceEndpoint: false
                });
            }
        });

        it('should log pre-auth started and completed events', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            sinon.stub(PacContext, "OrgInfo").get(() => ({
                EnvironmentId: "test-env-id",
                OrgUrl: "https://test.crm.dynamics.com"
            }));

            ArtemisContext.setContext({
                stamp: ServiceEndpointCategory.PROD,
                response: {
                    geoName: 'us',
                    environment: 'prod',
                    clusterNumber: '1',
                    geoLongName: 'United States',
                    clusterCategory: 'test-category',
                    clusterName: 'test-cluster',
                    clusterType: 'test-type'
                }
            });

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            await provider['preAuthenticateForWebsites']();

            // Check that pre-auth started was logged
            const preAuthStartedCall = traceInfoStub.getCalls().find(call =>
                call.args[0] === Constants.EventNames.ACTIONS_HUB_PRE_AUTH_STARTED
            );
            expect(preAuthStartedCall).to.not.be.undefined;

            // Check that pre-auth completed was logged
            const preAuthCompletedCall = traceInfoStub.getCalls().find(call =>
                call.args[0] === Constants.EventNames.ACTIONS_HUB_PRE_AUTH_COMPLETED
            );
            expect(preAuthCompletedCall).to.not.be.undefined;
        });

        it('should handle authentication errors gracefully', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            sinon.stub(PacContext, "OrgInfo").get(() => ({
                EnvironmentId: "test-env-id",
                OrgUrl: "https://test.crm.dynamics.com"
            }));

            ArtemisContext.setContext({
                stamp: ServiceEndpointCategory.PROD,
                response: {
                    geoName: 'us',
                    environment: 'prod',
                    clusterNumber: '1',
                    geoLongName: 'United States',
                    clusterCategory: 'test-category',
                    clusterName: 'test-cluster',
                    clusterType: 'test-type'
                }
            });

            // Stub the dynamic import to throw an error
            const authError = new Error('Authentication failed');
            sinon.stub(AuthenticationProvider, 'powerPlatformAPIAuthentication').rejects(authError);

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            await provider['preAuthenticateForWebsites']();

            // Should log error but not throw
            expect(traceErrorStub.called).to.be.true;
            const preAuthFailedCall = traceErrorStub.getCalls().find(call =>
                call.args[0] === Constants.EventNames.ACTIONS_HUB_PRE_AUTH_FAILED
            );
            expect(preAuthFailedCall).to.not.be.undefined;
        });

        it('should call pre-authentication before fetching websites', async () => {
            const mockActiveSites = [
                { name: "Foo", websiteRecordId: 'foo', websiteUrl: "https://foo.com" }
            ] as IWebsiteDetails[];
            const mockInactiveSites = [] as IWebsiteDetails[];
            const otherSites = [] as IOtherSiteInfo[];

            const fetchWebsitesStub = sinon.stub(ActionsHubUtils, 'fetchWebsites').resolves({
                activeSites: mockActiveSites,
                inactiveSites: mockInactiveSites,
                otherSites: otherSites
            });

            PacContext['_authInfo'] = mockAuthInfo;
            sinon.stub(PacContext, "OrgInfo").get(() => ({
                EnvironmentId: "test-env-id",
                OrgUrl: "https://test.crm.dynamics.com"
            }));

            ArtemisContext.setContext({
                stamp: ServiceEndpointCategory.PROD,
                response: {
                    geoName: 'us',
                    environment: 'prod',
                    clusterNumber: '1',
                    geoLongName: 'United States',
                    clusterCategory: 'test-category',
                    clusterName: 'test-cluster',
                    clusterType: 'test-type'
                }
            });

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            provider['_loadWebsites'] = true;

            // Spy on preAuthenticateForWebsites
            const preAuthSpy = sinon.spy(provider, 'preAuthenticateForWebsites' as keyof typeof provider);

            await provider['loadWebsites']();

            // Verify pre-auth was called
            expect(preAuthSpy.calledOnce).to.be.true;

            // Verify pre-auth was called before fetchWebsites
            expect(preAuthSpy.calledBefore(fetchWebsitesStub)).to.be.true;

            // Verify fetchWebsites was called
            expect(fetchWebsitesStub.calledOnce).to.be.true;
        });

        it('should authenticate sequentially for PPAPI and Dataverse', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            sinon.stub(PacContext, "OrgInfo").get(() => ({
                EnvironmentId: "test-env-id",
                OrgUrl: "https://test.crm.dynamics.com"
            }));

            ArtemisContext.setContext({
                stamp: ServiceEndpointCategory.PROD,
                response: {
                    geoName: 'us',
                    environment: 'prod',
                    clusterNumber: '1',
                    geoLongName: 'United States',
                    clusterCategory: 'test-category',
                    clusterName: 'test-cluster',
                    clusterType: 'test-type'
                }
            });

            // Stub the authentication functions to track call order
            const ppapiAuthStub = sinon.stub(AuthenticationProvider, 'powerPlatformAPIAuthentication').resolves('ppapi-token');
            const dataverseAuthStub = sinon.stub(AuthenticationProvider, 'dataverseAuthentication').resolves({ accessToken: 'dataverse-token', userId: 'user-id' });

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            await provider['preAuthenticateForWebsites']();

            // Verify both authentications were called
            expect(ppapiAuthStub.calledOnce).to.be.true;
            expect(dataverseAuthStub.calledOnce).to.be.true;

            // Verify PPAPI auth was called with correct parameters
            expect(ppapiAuthStub.firstCall.args[0]).to.equal(ServiceEndpointCategory.PROD);
            expect(ppapiAuthStub.firstCall.args[1]).to.equal(false); // firstTimeAuth = false

            // Verify Dataverse auth was called with correct parameters
            expect(dataverseAuthStub.firstCall.args[0]).to.equal("https://test.crm.dynamics.com");
            expect(dataverseAuthStub.firstCall.args[1]).to.equal(false); // firstTimeAuth = false

            // Verify PPAPI auth was called before Dataverse auth (sequential, not parallel)
            expect(ppapiAuthStub.calledBefore(dataverseAuthStub)).to.be.true;
        });

        it('should not load websites multiple times when _loadWebsites is false', async () => {
            const fetchWebsitesStub = sinon.stub(ActionsHubUtils, 'fetchWebsites').resolves({
                activeSites: [],
                inactiveSites: [],
                otherSites: []
            });

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            provider['_loadWebsites'] = false;

            await provider['loadWebsites']();

            // Verify fetchWebsites was not called
            expect(fetchWebsitesStub.called).to.be.false;
        });

        it('should handle pre-auth errors and continue with website loading', async () => {
            const mockActiveSites = [
                { name: "Foo", websiteRecordId: 'foo', websiteUrl: "https://foo.com" }
            ] as IWebsiteDetails[];

            const fetchWebsitesStub = sinon.stub(ActionsHubUtils, 'fetchWebsites').resolves({
                activeSites: mockActiveSites,
                inactiveSites: [],
                otherSites: []
            });

            PacContext['_authInfo'] = mockAuthInfo;
            sinon.stub(PacContext, "OrgInfo").get(() => ({
                EnvironmentId: "test-env-id",
                OrgUrl: "https://test.crm.dynamics.com"
            }));

            ArtemisContext.setContext({
                stamp: ServiceEndpointCategory.PROD,
                response: {
                    geoName: 'us',
                    environment: 'prod',
                    clusterNumber: '1',
                    geoLongName: 'United States',
                    clusterCategory: 'test-category',
                    clusterName: 'test-cluster',
                    clusterType: 'test-type'
                }
            });

            // Stub pre-auth to throw error
            sinon.stub(AuthenticationProvider, 'powerPlatformAPIAuthentication').rejects(new Error('Auth failed'));

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            provider['_loadWebsites'] = true;

            await provider['loadWebsites']();

            // Verify error was logged
            expect(traceErrorStub.called).to.be.true;

            // Verify fetchWebsites was still called despite pre-auth error
            expect(fetchWebsitesStub.calledOnce).to.be.true;
        });
    });
});
