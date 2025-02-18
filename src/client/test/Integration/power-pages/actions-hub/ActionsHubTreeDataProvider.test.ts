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
import * as WebsiteUtil from "../../../../../common/utilities/WebsiteUtil";
import { IWebsiteDetails } from "../../../../../common/services/Interfaces";

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
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('initialize', () => {
        it("should register refresh command", () => {
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.refresh")).to.be.true;
        });

        it("should register switchEnvironment command", () => {
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.switchEnvironment")).to.be.true;
        });

        it("should register showEnvironmentDetails command", () => {
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.showEnvironmentDetails")).to.be.true;
        });

        it("should register openActiveSitesInStudio command", () => {
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.openActiveSitesInStudio")).to.be.true;
        });

        it("should register openInactiveSitesInStudio command", () => {
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.openInactiveSitesInStudio")).to.be.true;
        });

        it("should register preview command", () => {
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("microsoft.powerplatform.pages.actionsHub.activeSite.preview")).to.be.true;
        });

        it("should register newAuthProfile command", () => {
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            expect(registerCommandStub.calledWith("powerpages.actionsHub.newAuthProfile")).to.be.true;
        });
    });

    describe('getTreeItem', () => {
        it("should return the element in getTreeItem", () => {
            const element = {} as ActionsHubTreeItem;
            const result = ActionsHubTreeDataProvider.initialize(context, pacTerminal).getTreeItem(element);
            expect(result).to.equal(element);
        });
    });

    describe('getChildren', () => {
        it("should return environment group tree item with default name when no auth info is available", async () => {
            const mockActiveSites = [
                { Name: "Foo", WebsiteRecordId: 'foo', WebsiteUrl: "https://foo.com" }
            ] as IWebsiteDetails[];
            const mockAllSites = [
                { Name: "Foo", WebsiteRecordId: 'foo', WebsiteUrl: "https://foo.com" },
                { Name: "Bar", WebsiteRecordId: 'Bar', WebsiteUrl: "https://bar.com" }
            ] as IWebsiteDetails[];

            sinon.stub(WebsiteUtil, 'getActiveWebsites').resolves(mockActiveSites);
            sinon.stub(WebsiteUtil, 'getAllWebsites').resolves(mockAllSites);

            PacContext['_authInfo'] = null;
            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            const result = await provider.getChildren();

            expect(result).to.not.be.null;
            expect(result).to.not.be.undefined;
            expect(result).to.have.lengthOf(0);
        });

        it("should call element.getChildren when an element is passed", async () => {
            const element = new SiteTreeItem({} as IWebsiteInfo);
            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            const getChildrenStub = sinon.stub(element, "getChildren").resolves([]);

            const result = await provider.getChildren(element);

            expect(getChildrenStub.calledOnce).to.be.true;
            expect(result).to.deep.equal([]);
        });

        it("should return environment and other sites group tree items when auth info and Artemis context are available", async () => {
            const mockActiveSites = [
                { Name: "Foo", WebsiteRecordId: 'foo', WebsiteUrl: "https://foo.com" }
            ] as IWebsiteDetails[];
            const mockAllSites = [
                { Name: "Foo", WebsiteRecordId: 'foo', WebsiteUrl: "https://foo.com" },
                { Name: "Bar", WebsiteRecordId: 'Bar', WebsiteUrl: "https://bar.com" }
            ] as IWebsiteDetails[];

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

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            sinon.stub(WebsiteUtil, 'getActiveWebsites').resolves(mockActiveSites);
            sinon.stub(WebsiteUtil, 'getAllWebsites').resolves(mockAllSites);

            const result = await provider.getChildren();

            expect(result).to.not.be.null;
            expect(result).to.not.be.undefined;
            expect(result).to.have.lengthOf(2);
            expect(result![0]).to.be.instanceOf(EnvironmentGroupTreeItem);
            expect(result![1]).to.be.instanceOf(OtherSitesGroupTreeItem);

            const environmentGroup = result![0] as EnvironmentGroupTreeItem;
            expect(environmentGroup.environmentInfo.currentEnvironmentName).to.equal("TestOrg");
            expect(environmentGroup['_activeSites']).to.deep.equal(mockActiveSites);
            expect(environmentGroup['_inactiveSites']).to.deep.equal([mockAllSites[1]]);
        });

        it("should return empty array when auth info is not available", async () => {
            sinon.stub(PacContext, "AuthInfo").get(() => null);

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            const result = await provider.getChildren();

            expect(result).to.be.an('array').that.is.empty;
        });

        it("should call element.getChildren when an element is passed", async () => {
            const element = new SiteTreeItem({} as IWebsiteInfo);
            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            const getChildrenStub = sinon.stub(element, "getChildren").resolves([]);

            const result = await provider.getChildren(element);

            expect(getChildrenStub.calledOnce).to.be.true;
            expect(result).to.deep.equal([]);
        });
    });
});
