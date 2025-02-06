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
import { Constants } from "../../../../power-pages/actions-hub/Constants";
import { EnvironmentGroupTreeItem } from "../../../../power-pages/actions-hub/tree-items/EnvironmentGroupTreeItem";
import { OtherSitesGroupTreeItem } from "../../../../power-pages/actions-hub/tree-items/OtherSitesGroupTreeItem";
import { ActionsHubTreeItem } from "../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { pacAuthManager } from "../../../../pac/PacAuthManager";
import { PacTerminal } from "../../../../lib/PacTerminal";
import { PacWrapper } from "../../../../pac/PacWrapper";
import { SUCCESS } from "../../../../../common/constants";

describe("ActionsHubTreeDataProvider", () => {
    let context: vscode.ExtensionContext;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
    let authInfoStub: sinon.SinonStub;
    let pacTerminal: PacTerminal;
    let pacWrapperStub: sinon.SinonStubbedInstance<PacWrapper>;
    let registerCommandStub: sinon.SinonStub;

    beforeEach(() => {
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
        authInfoStub = sinon.stub(pacAuthManager, "getAuthInfo");
        pacTerminal = sinon.createStubInstance(PacTerminal);
        pacWrapperStub = sinon.createStubInstance(PacWrapper);
        pacWrapperStub.activeAuth.resolves({ Status: SUCCESS, Results: [], Errors: [], Information: [] });
        (pacTerminal.getWrapper as sinon.SinonStub).returns(pacWrapperStub);
        registerCommandStub = sinon.stub(vscode.commands, "registerCommand");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('initialize', () => {
        it("should initialize and log initialization event", () => {
            ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_INITIALIZED)).to.be.true;
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
        it("should return environment and other sites group tree items in getChildren when no element is passed", async () => {
            authInfoStub.returns({
                organizationFriendlyName: "TestOrg",
                userType: "",
                cloud: "",
                tenantId: "",
                tenantCountry: "",
                user: "",
                entraIdObjectId: "",
                puid: "",
                userCountryRegion: "",
                tokenExpires: "",
                authority: "",
                environmentGeo: "",
                environmentId: "",
                environmentType: "",
                organizationId: "",
                organizationUniqueName: ""
            });
            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            const result = await provider.getChildren();

            expect(result).to.not.be.null;
            expect(result).to.not.be.undefined;
            expect(result).to.have.lengthOf(2);
            expect(result![0]).to.be.instanceOf(EnvironmentGroupTreeItem);
            expect(result![1]).to.be.instanceOf(OtherSitesGroupTreeItem);
        });

        it("should return environment group tree item with default name when no auth info is available", async () => {
            authInfoStub.returns(null);
            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            const result = await provider.getChildren();

            expect(result).to.not.be.null;
            expect(result).to.not.be.undefined;
            expect(result).to.have.lengthOf(2);
            expect(result![0]).to.be.instanceOf(EnvironmentGroupTreeItem);
            expect((result![0] as EnvironmentGroupTreeItem).environmentInfo.currentEnvironmentName).to.equal(Constants.Strings.NO_ENVIRONMENTS_FOUND);
            expect(result![1]).to.be.instanceOf(OtherSitesGroupTreeItem);
        });

        it("should return null in getChildren when an error occurs", async () => {
            authInfoStub.throws(new Error("Test Error"));

            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            const result = await provider.getChildren();

            expect(result).to.be.null;
            expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_CURRENT_ENV_FETCH_FAILED)).to.be.true;

            authInfoStub.restore();
        });

        it("should return an empty array in getChildren when an element is passed", async () => {
            const element = {} as ActionsHubTreeItem;
            const provider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            const result = await provider.getChildren(element);

            expect(result).to.be.an("array").that.is.empty;
        });
    });

    describe('dispose', () => {
        it("should dispose all disposables", () => {
            const disposable1 = { dispose: sinon.spy() };
            const disposable2 = { dispose: sinon.spy() };
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            actionsHubTreeDataProvider["_disposables"].push(disposable1 as vscode.Disposable, disposable2 as vscode.Disposable);

            actionsHubTreeDataProvider.dispose();
            expect(disposable1.dispose.calledOnce).to.be.true;
            expect(disposable2.dispose.calledOnce).to.be.true;
        });
    });

    describe('registerPanel', () => {
        it("should register refresh command and handle errors", async () => {
            const actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            const refreshStub = sinon.stub(actionsHubTreeDataProvider, "refresh");

            actionsHubTreeDataProvider["registerPanel"](pacTerminal);

            const refreshCommandCallback = registerCommandStub.args[0][1];
            await refreshCommandCallback();

            expect(registerCommandStub.calledOnceWith("powerpages.actionsHub.refresh", sinon.match.func)).to.be.true;
            expect(refreshStub.calledOnce).to.be.true;
            expect(traceErrorStub.called).to.be.false;

            // Simulate error
            pacWrapperStub.activeAuth.returns(Promise.reject(new Error("Test Error")));
            await refreshCommandCallback();

            expect(traceErrorStub.calledOnceWith(Constants.EventNames.ACTIONS_HUB_REFRESH_FAILED)).to.be.true;
        });
    });
});
