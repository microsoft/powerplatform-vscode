/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { EnvironmentGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/EnvironmentGroupTreeItem";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { IWebsiteDetails } from "../../../../../../common/services/Interfaces";
import { WebsiteDataModel } from "../../../../../../common/services/Constants";
import { ActiveGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActiveGroupTreeItem";
import { InactiveGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/InactiveGroupTreeItem";

describe('EnvironmentGroupTreeItem', () => {
    it('should be of type EnvironmentGroupTreeItem', () => {
        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext, [], []);

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext, [], []);

        expect(treeItem.label).to.be.equal("Test Environment");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext, [], []);

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Expanded);
    });

    it('should have the expected icon', () => {
        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext, [], []);

        expect((treeItem.iconPath as { light: vscode.Uri, dark: vscode.Uri }).light.path).to.be.equal('/src/client/assets/environment-icon/light/environment.svg');
        expect((treeItem.iconPath as { light: vscode.Uri, dark: vscode.Uri }).dark.path).to.be.equal('/src/client/assets/environment-icon/dark/environment.svg');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext, [], []);

        expect(treeItem.contextValue).to.be.equal("environmentGroup");
    });

    it('should return the expected children', async () => {
        const activeWebsites: IWebsiteDetails[] = [
            { WebsiteRecordId: "1", Name: "Active Site 1", WebsiteUrl: "http://activesite1.com", DataverseInstanceUrl: "http://dataverse1.com", DataverseOrganizationId: "org1", DataModel: WebsiteDataModel.Standard, EnvironmentId: "env1" },
            { WebsiteRecordId: "2", Name: "Active Site 2", WebsiteUrl: "http://activesite2.com", DataverseInstanceUrl: "http://dataverse2.com", DataverseOrganizationId: "org2", DataModel: WebsiteDataModel.Enhanced, EnvironmentId: "env2" }
        ];

        const inactiveWebsites: IWebsiteDetails[] = [
            { WebsiteRecordId: "3", Name: "Inactive Site 1", WebsiteUrl: "http://inactivesite1.com", DataverseInstanceUrl: "http://dataverse3.com", DataverseOrganizationId: "org3", DataModel: WebsiteDataModel.Standard, EnvironmentId: "env3" },
            { WebsiteRecordId: "4", Name: "Inactive Site 2", WebsiteUrl: "http://inactivesite2.com", DataverseInstanceUrl: "http://dataverse4.com", DataverseOrganizationId: "org4", DataModel: WebsiteDataModel.Enhanced, EnvironmentId: "env4" }
        ];

        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext, activeWebsites, inactiveWebsites);
        const children = await treeItem.getChildren();

        expect(children).to.have.lengthOf(2);

        const activeGroup = children[0] as ActiveGroupTreeItem;
        expect(activeGroup).to.be.instanceOf(ActiveGroupTreeItem);
        expect(activeGroup.getChildren()).to.have.lengthOf(2);
        expect(activeGroup.getChildren()[0].label).to.equal("Active Site 1");
        expect(activeGroup.getChildren()[1].label).to.equal("Active Site 2");

        const inactiveGroup = children[1] as InactiveGroupTreeItem;
        expect(inactiveGroup).to.be.instanceOf(InactiveGroupTreeItem);
        expect(inactiveGroup.getChildren()).to.have.lengthOf(2);
        expect(inactiveGroup.getChildren()[0].label).to.equal("Inactive Site 1");
        expect(inactiveGroup.getChildren()[1].label).to.equal("Inactive Site 2");
    });
});
