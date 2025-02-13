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
import { NoSitesTreeItem } from "../../../../../power-pages/actions-hub/tree-items/NoSitesTreeItem";

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

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Expanded);
    });

    it('should have the expected icon', () => {
        const treeItem = new InactiveGroupTreeItem([]);

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('folder');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new InactiveGroupTreeItem([]);

        expect(treeItem.contextValue).to.be.equal("inactiveSitesGroup");
    });

    describe('getChildren', () => {
        describe('when active sites is empty', () => {
            it('should return NoSitesTreeItem', () => {
                const treeItem = new InactiveGroupTreeItem([]);

                const children = treeItem.getChildren();

                expect(children).to.be.lengthOf(1);
                expect(children[0]).to.be.instanceOf(NoSitesTreeItem);
            });
        });

        describe('when active sites is not empty', () => {
            it('should return an array of SiteTreeItem', () => {
                const inactiveWebsites: IWebsiteDetails[] = [
                    { WebsiteRecordId: "1", Name: "Site 1", WebsiteUrl: "http://site1.com", DataverseInstanceUrl: "http://dataverse1.com", DataverseOrganizationId: "org1", DataModel: WebsiteDataModel.Standard, EnvironmentId: "env1" },
                    { WebsiteRecordId: "2", Name: "Site 2", WebsiteUrl: "http://site2.com", DataverseInstanceUrl: "http://dataverse2.com", DataverseOrganizationId: "org2", DataModel: WebsiteDataModel.Enhanced, EnvironmentId: "env2" }
                ];

                const treeItem = new InactiveGroupTreeItem(inactiveWebsites);
                const children = treeItem.getChildren();

                const site1 = children[0] as SiteTreeItem;
                expect(site1.label).to.equal("Site 1");

                const site2 = children[1] as SiteTreeItem;
                expect(site2.label).to.equal("Site 2");
            });
        });
    });
});
