/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { ActiveGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActiveGroupTreeItem";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { WebsiteDataModel } from "../../../../../../common/services/Constants";
import { SiteTreeItem } from "../../../../../power-pages/actions-hub/tree-items/SiteTreeItem";
import { NoSitesTreeItem } from "../../../../../power-pages/actions-hub/tree-items/NoSitesTreeItem";
import { IWebsiteDetails } from "../../../../../../common/services/Interfaces";
import sinon from "sinon";
import { WebsiteStatus } from "../../../../../power-pages/actions-hub/models/WebsiteStatus";
import CurrentSiteContext from "../../../../../power-pages/actions-hub/CurrentSiteContext";

describe('ActiveGroupTreeItem', () => {
    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new ActiveGroupTreeItem([]);

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new ActiveGroupTreeItem([]);

        expect(treeItem.label).to.be.equal("Active Sites");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new ActiveGroupTreeItem([]);

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Expanded);
    });

    it('should have the expected icon', () => {
        const treeItem = new ActiveGroupTreeItem([]);

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('folder');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new ActiveGroupTreeItem([]);

        expect(treeItem.contextValue).to.be.equal("activeSitesGroup");
    });

    describe('getChildren', () => {
        describe('when active sites is empty', () => {
            it('should return NoSitesTreeItem', () => {
                const treeItem = new ActiveGroupTreeItem([]);

                const children = treeItem.getChildren();

                expect(children).to.be.lengthOf(1);
                expect(children[0]).to.be.instanceOf(NoSitesTreeItem);
            });
        });

        describe('when active sites is not empty', () => {
            beforeEach(() => {
                sinon.stub(CurrentSiteContext, 'currentSiteId').value('1');
            });

            it('should return an array of SiteTreeItem', () => {
                const activeWebsites: IWebsiteDetails[] = [
                    {
                        websiteRecordId: "1",
                        name: "Site 1",
                        websiteUrl: "http://site1.com",
                        dataverseInstanceUrl: "http://dataverse1.com",
                        dataverseOrganizationId: "org1",
                        dataModel: WebsiteDataModel.Standard,
                        environmentId: "env1",
                        siteVisibility: "public",
                        siteManagementUrl: "http://site1.com/manage"
                    },
                    {
                        websiteRecordId: "2",
                        name: "Site 2",
                        websiteUrl: "http://site2.com",
                        dataverseInstanceUrl: "http://dataverse2.com",
                        dataverseOrganizationId: "org2",
                        dataModel: WebsiteDataModel.Enhanced,
                        environmentId: "env2",
                        siteVisibility: "private",
                        siteManagementUrl: "http://site1.com/manage"
                    }
                ];

                const treeItem = new ActiveGroupTreeItem(activeWebsites);
                const children = treeItem.getChildren();

                const site1 = children[0] as SiteTreeItem;
                expect(site1.siteInfo).to.deep.equal({
                    name: 'Site 1',
                    websiteId: '1',
                    dataModelVersion: 1,
                    websiteUrl: 'http://site1.com',
                    status: WebsiteStatus.Active,
                    isCurrent: true,
                    siteVisibility: "public",
                    siteManagementUrl: "http://site1.com/manage"
                });

                const site2 = children[1] as SiteTreeItem;
                expect(site2.siteInfo).to.deep.equal({
                    name: 'Site 2',
                    websiteId: '2',
                    dataModelVersion: 2,
                    websiteUrl: 'http://site2.com',
                    status: WebsiteStatus.Active,
                    isCurrent: false,
                    siteVisibility: "private",
                    siteManagementUrl: "http://site1.com/manage"
                });
            });
        });
    });
});
