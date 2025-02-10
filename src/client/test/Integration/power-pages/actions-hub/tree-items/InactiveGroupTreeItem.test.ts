/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { InactiveGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/InactiveGroupTreeItem";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { IWebsiteDetails } from "../../../../../../common/services/Interfaces";
import { SiteTreeItem } from "../../../../../power-pages/actions-hub/tree-items/SiteTreeItem";
import { WebsiteDataModel } from "../../../../../../common/services/Constants";

describe('InactiveGroupTreeItem', () => {
    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new InactiveGroupTreeItem([]);

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new InactiveGroupTreeItem([]);

        expect(treeItem.label).to.be.equal("Inactive Sites");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new InactiveGroupTreeItem([]);

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Collapsed);
    });

    it('should have the expected icon', () => {
        const treeItem = new InactiveGroupTreeItem([]);

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('folder');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new InactiveGroupTreeItem([]);

        expect(treeItem.contextValue).to.be.equal("inactiveSitesGroup");
    });

    it('should have the expected children', () => {
        const inactiveWebsites: IWebsiteDetails[] = [
            { websiteRecordId: "1", name: "Site 1", websiteUrl: "http://site1.com", dataverseInstanceUrl: "http://dataverse1.com", dataverseOrganizationId: "org1", dataModel: WebsiteDataModel.Standard, environmentId: "env1" },
            { websiteRecordId: "2", name: "Site 2", websiteUrl: "http://site2.com", dataverseInstanceUrl: "http://dataverse2.com", dataverseOrganizationId: "org2", dataModel: WebsiteDataModel.Enhanced, environmentId: "env2" }
        ];

        const treeItem = new InactiveGroupTreeItem(inactiveWebsites);
        const children = treeItem.getChildren();

        const site1 = children[0] as SiteTreeItem;
        expect(site1.label).to.equal("Site 1");

        const site2 = children[1] as SiteTreeItem;
        expect(site2.label).to.equal("Site 2");
    });
});
