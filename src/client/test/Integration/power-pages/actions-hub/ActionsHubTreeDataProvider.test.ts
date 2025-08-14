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
import { ActionsHubTreeItem } from "../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { PacTerminal } from "../../../../lib/PacTerminal";
import { PacWrapper } from "../../../../pac/PacWrapper";
import { SUCCESS } from "../../../../../common/constants";
import { SiteTreeItem } from "../../../../power-pages/actions-hub/tree-items/SiteTreeItem";
import { IWebsiteInfo } from "../../../../power-pages/actions-hub/models/IWebsiteInfo";
import PacContext from "../../../../pac/PacContext";
import { CloudInstance, EnvironmentType } from "../../../../pac/PacTypes";
import { IOtherSiteInfo, IWebsiteDetails } from "../../../../../common/services/Interfaces";
import * as CommandHandlers from "../../../../power-pages/actions-hub/ActionsHubCommandHandlers";
import { Constants } from "../../../../power-pages/actions-hub/Constants";
import * as TelemetryHelper from "../../../../power-pages/actions-hub/TelemetryHelper";

// Add global type declaration for ArtemisContext
describe("ActionsHubTreeDataProvider", () => {
    let context: vscode.ExtensionContext;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
    let pacTerminal: PacTerminal;
    let pacWrapperStub: sinon.SinonStubbedInstance<PacWrapper>;
    let registerCommandStub: sinon.SinonStub;

    beforeEach(() => {
        registerCommandStub = sinon.stub(vscode.commands, "registerCommand");
        context = {
            extensionUri: vscode.Uri.parse("https://localhost:3000")
        } as vscode.ExtensionContext;
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
            const mockCommandHandler = sinon.stub(CommandHandlers, 'refreshEnvironment');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.refresh")).to.be.true;

            await registerCommandStub.getCall(0).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register switchEnvironment command", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'switchEnvironment');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.switchEnvironment")).to.be.true;

            await registerCommandStub.getCall(1).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register showEnvironmentDetails command", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'showEnvironmentDetails');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.showEnvironmentDetails")).to.be.true;

            await registerCommandStub.getCall(2).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register openActiveSitesInStudio command", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'openActiveSitesInStudio');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.openActiveSitesInStudio")).to.be.true;

            await registerCommandStub.getCall(3).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register openInactiveSitesInStudio command", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'openInactiveSitesInStudio');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.openInactiveSitesInStudio")).to.be.true;

            await registerCommandStub.getCall(4).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register preview command", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'previewSite');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.preview")).to.be.true;

            await registerCommandStub.getCall(5).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register newAuthProfile command", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'createNewAuthProfile');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.newAuthProfile")).to.be.true;

            await registerCommandStub.getCall(6).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register revealInOS commands", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'revealInOS');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.windows")).to.be.true;
            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.mac")).to.be.true;
            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.linux")).to.be.true;

            await registerCommandStub.getCall(7).args[1]();
            await registerCommandStub.getCall(8).args[1]();
            await registerCommandStub.getCall(9).args[1]();
            expect(mockCommandHandler.calledThrice).to.be.true;
        });

        it("should register openSiteManagement commands", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'openSiteManagement');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.inactiveSite.openSiteManagement")).to.be.true;

            await registerCommandStub.getCall(10).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        //command "microsoft.powerplatform.pages.actionsHub.activeSite.uploadSite"
        it("should register uploadSite command", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'uploadSite');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.uploadSite")).to.be.true;

            await registerCommandStub.getCall(11).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register siteDetails command", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'showSiteDetails');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.siteDetails")).to.be.true;

            await registerCommandStub.getCall(12).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it("should register downloadSite command", async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'downloadSite');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.downloadSite")).to.be.true;

            await registerCommandStub.getCall(13).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it('should register openSiteInStudio command', async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'openInStudio');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, false);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.openInStudio")).to.be.true;

            await registerCommandStub.getCall(14).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
        });

        it('should register runCodeQLScreening command', async () => {
            const mockCommandHandler = sinon.stub(CommandHandlers, 'runCodeQLScreening');
            mockCommandHandler.resolves();
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal, true);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.currentActiveSite.runCodeQLScreening")).to.be.true;

            await registerCommandStub.getCall(16).args[1]();
            expect(mockCommandHandler.calledOnce).to.be.true;
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
        it ('should call traceInfo', async () => {
            const mockActiveSites = [
                { name: "Foo", websiteRecordId: 'foo', websiteUrl: "https://foo.com" }
            ] as IWebsiteDetails[];
            const mockInactiveSites = [
                { name: "Bar", websiteRecordId: 'Bar', websiteUrl: "https://bar.com" }
            ] as IWebsiteDetails[];
            const otherSites = [
                { name: "Baz", websiteId: 'baz' }
            ] as IOtherSiteInfo[];
            sinon.stub(CommandHandlers, 'fetchWebsites').resolves({ activeSites: mockActiveSites, inactiveSites: mockInactiveSites, otherSites: otherSites });

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
            sinon.stub(CommandHandlers, 'fetchWebsites').resolves({ activeSites: mockActiveSites, inactiveSites: mockInactiveSites, otherSites: otherSites });

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
            sinon.stub(CommandHandlers, 'fetchWebsites').resolves({ activeSites: mockActiveSites, inactiveSites: mockInactiveSites, otherSites: otherSites });
            sinon.stub(vscode.authentication, 'getSession').resolves({ accessToken: 'foo' } as vscode.AuthenticationSession);

            sinon.stub(PacContext, "AuthInfo").get(() => ({
                OrganizationFriendlyName: "TestOrg",
                UserType: "",
                Cloud: CloudInstance.Preprod,
                TenantId: "",
                TenantCountry: "",
                User: "",
                EntraIdObjectId: "",
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
            expect(result).to.have.lengthOf(2);
            expect(result![0]).to.be.instanceOf(EnvironmentGroupTreeItem);
            expect(result![1]).to.be.instanceOf(OtherSitesGroupTreeItem);

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
            sinon.stub(CommandHandlers, 'fetchWebsites').resolves({ activeSites: [], inactiveSites: [], otherSites: [] });
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
            const mockFetchWebsites = sinon.stub(CommandHandlers, 'fetchWebsites').resolves({ activeSites: mockActiveSites, inactiveSites: mockInactiveSites, otherSites: otherSites });
            sinon.stub(vscode.authentication, 'getSession').resolves({ accessToken: 'foo' } as vscode.AuthenticationSession);

            PacContext['_authInfo'] = {
                OrganizationFriendlyName: "TestOrg",
                UserType: "",
                Cloud: CloudInstance.Preprod,
                TenantId: "",
                TenantCountry: "",
                User: "",
                EntraIdObjectId: "",
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
});
