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
import * as CreateNewAuthProfileHandler from "../../../../power-pages/actions-hub/handlers/CreateNewAuthProfileHandler";
import * as RevealInOSHandler from "../../../../power-pages/actions-hub/handlers/RevealInOSHandler";
import * as OpenSiteManagementHandler from "../../../../power-pages/actions-hub/handlers/OpenSiteManagementHandler";
import * as UploadSiteHandler from "../../../../power-pages/actions-hub/handlers/UploadSiteHandler";
import * as ShowSiteDetailsHandler from "../../../../power-pages/actions-hub/handlers/ShowSiteDetailsHandler";
import * as DownloadSiteHandler from "../../../../power-pages/actions-hub/handlers/DownloadSiteHandler";
import * as LoginToMatchHandler from "../../../../power-pages/actions-hub/handlers/LoginToMatchHandler";
import * as RunCodeQLScreeningHandler from "../../../../power-pages/actions-hub/handlers/code-ql/RunCodeQlScreeningHandler";

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

        it("should register newAuthProfile command", async () => {
            const mockCommandHandler = sinon.stub(CreateNewAuthProfileHandler, 'createNewAuthProfile');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.newAuthProfile")).to.be.true;

            await registerCommandStub.getCall(6).args[1]();
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

            await registerCommandStub.getCall(7).args[1]();
            await registerCommandStub.getCall(8).args[1]();
            await registerCommandStub.getCall(9).args[1]();
            expect(mockCommandHandler.calledThrice).to.be.true;
        });

        it("should register openSiteManagement commands", async () => {
            const mockCommandHandler = sinon.stub(OpenSiteManagementHandler, 'openSiteManagement');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.inactiveSite.openSiteManagement")).to.be.true;

            await registerCommandStub.getCall(10).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        //command "microsoft.powerplatform.pages.actionsHub.activeSite.uploadSite"
        it("should register uploadSite command", async () => {
            const mockCommandHandler = sinon.stub(UploadSiteHandler, 'uploadSite');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.uploadSite")).to.be.true;

            await registerCommandStub.getCall(11).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register siteDetails command", async () => {
            const mockCommandHandler = sinon.stub(ShowSiteDetailsHandler, 'showSiteDetails');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.siteDetails")).to.be.true;

            await registerCommandStub.getCall(12).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register downloadSite command", async () => {
            const mockCommandHandler = sinon.stub(DownloadSiteHandler, 'downloadSite');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.downloadSite")).to.be.true;

            await registerCommandStub.getCall(13).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it('should register openSiteInStudio command', async () => {
            const mockCommandHandler = sinon.stub(OpenSiteInStudioHandler, 'openSiteInStudio');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"]();

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.openInStudio")).to.be.true;

            await registerCommandStub.getCall(14).args[1]();
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
            expect(traceInfoStub.calledTwice).to.be.true;
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
});
