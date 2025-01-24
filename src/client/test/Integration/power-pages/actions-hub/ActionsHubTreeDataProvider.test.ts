/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
 import * as sinon from "sinon";
 import * as vscode from "vscode";
 import { ActionsHubTreeDataProvider } from "../../../../power-pages/actions-hub/ActionsHubTreeDataProvider";
 import { oneDSLoggerWrapper } from "../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
 import { Constants } from "../../../../power-pages/actions-hub/Constants";
//  import { EnvironmentGroupTreeItem } from "../../../../power-pages/actions-hub/tree-items/EnvironmentGroupTreeItem";
//  import { OtherSitesGroupTreeItem } from "../../../../power-pages/actions-hub/tree-items/OtherSitesGroupTreeItem";
import { ActionsHubTreeItem } from "../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { PacTerminal } from "../../../../lib/PacTerminal";

 describe("ActionsHubTreeDataProvider", () => {
     let context: vscode.ExtensionContext;
     let pacTerminal: PacTerminal;
     let actionsHubTreeDataProvider: ActionsHubTreeDataProvider;

     beforeEach(() => {
         context = {} as vscode.ExtensionContext;
         pacTerminal = {} as PacTerminal;
         actionsHubTreeDataProvider = ActionsHubTreeDataProvider.initialize(context, pacTerminal);
     });

     afterEach(() => {
         sinon.restore();
     });

     it("should initialize and log initialization event", () => {
         const traceInfoStub = sinon.stub(oneDSLoggerWrapper.getLogger(), "traceInfo");
         ActionsHubTreeDataProvider.initialize(context, pacTerminal);
         expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_INITIALIZED)).to.be.true;
     });

     it("should return the element in getTreeItem", () => {
         const element = {} as ActionsHubTreeItem;
         const result = actionsHubTreeDataProvider.getTreeItem(element);
         expect(result).to.equal(element);
     });

    //TODO: Fix this test for pacWrapper
    //  it("should return environment and other sites group tree items in getChildren when no element is passed", async () => {
    //      const pacWrapper = {
    //          activeAuth: sinon.stub().resolves({ Status: "Success", Results: [{ Key: "OrganizationFriendlyNameKey", Value: "TestOrg" }] })
    //      };
    //      sinon.stub(pacTerminal, "getWrapper").returns(pacWrapper);

    //      const result = await actionsHubTreeDataProvider.getChildren();
    //      expect(result).to.not.be.null;
    //      expect(result).to.not.be.undefined;
    //      expect(result).to.have.lengthOf(2);
    //      expect(result![0]).to.be.instanceOf(EnvironmentGroupTreeItem);
    //      expect(result![1]).to.be.instanceOf(OtherSitesGroupTreeItem);
    //  });

     it("should return null in getChildren when an error occurs", async () => {
         sinon.stub(pacTerminal, "getWrapper").throws(new Error("Test Error"));
         const traceErrorStub = sinon.stub(oneDSLoggerWrapper.getLogger(), "traceError");

         const result = await actionsHubTreeDataProvider.getChildren();
         expect(result).to.be.null;
         expect(traceErrorStub.calledWith(Constants.EventNames.ACTIONS_HUB_CURRENT_ENV_FETCH_FAILED)).to.be.true;
     });

     it("should return an empty array in getChildren when an element is passed", async () => {
         const element = {} as ActionsHubTreeItem;
         const result = await actionsHubTreeDataProvider.getChildren(element);
         expect(result).to.be.an("array").that.is.empty;
     });

     it("should dispose all disposables", () => {
         const disposable1 = { dispose: sinon.spy() };
         const disposable2 = { dispose: sinon.spy() };
         actionsHubTreeDataProvider["_disposables"].push(disposable1 as vscode.Disposable, disposable2 as vscode.Disposable);

         actionsHubTreeDataProvider.dispose();
         expect(disposable1.dispose.calledOnce).to.be.true;
         expect(disposable2.dispose.calledOnce).to.be.true;
     });


 });
