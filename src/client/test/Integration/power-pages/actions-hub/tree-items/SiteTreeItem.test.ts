/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { SiteTreeItem } from "../../../../../power-pages/actions-hub/tree-items/SiteTreeItem";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { WebsiteStatus } from "../../../../../power-pages/actions-hub/models/WebsiteStatus";
import { IWebsiteInfo } from "../../../../../power-pages/actions-hub/models/IWebsiteInfo";
import { SiteVisibility } from "../../../../../power-pages/actions-hub/models/SiteVisibility";

describe('SiteTreeItem', () => {
    let mockSiteInfo: IWebsiteInfo;

    beforeEach(() => {
        mockSiteInfo = {
            name: "Test Site",
            websiteId: 'test-id',
            dataModelVersion: 1,
            status: WebsiteStatus.Active,
            websiteUrl: "https://foo",
            isCurrent: false,
            siteVisibility: SiteVisibility.Public,
            siteManagementUrl: "https://powerpagesmanagement.com",
            createdOn: "2025-03-20",
            creator: "Test Creator",
            isCodeSite: true
        };
    });

    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new SiteTreeItem(mockSiteInfo);

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new SiteTreeItem(mockSiteInfo);

        expect(treeItem.label).to.be.equal("Test Site");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new SiteTreeItem(mockSiteInfo);

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.None);
    });

    it('should have the expected icon', () => {
        const treeItem = new SiteTreeItem(mockSiteInfo);

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('globe');
    });

    it('should have the expected contextValue when the site is Active and current', () => {
        const treeItem = new SiteTreeItem({ ...mockSiteInfo, isCurrent: true });

        expect(treeItem.contextValue).to.be.equal("currentActiveSite");
    });

    it('should have the expected contextValue when the site is Active and not current', () => {
        const treeItem = new SiteTreeItem(mockSiteInfo);

        expect(treeItem.contextValue).to.be.equal("nonCurrentActiveSite");
    });

    it('should have the expected contextValue when the site is Inactive', () => {
        const treeItem = new SiteTreeItem({ ...mockSiteInfo, status: WebsiteStatus.Inactive });

        expect(treeItem.contextValue).to.be.equal("inactiveSite");
    });

    it('should have the expected contextValue when the site is neither Active nor Inactive', () => {
        const treeItem = new SiteTreeItem({ ...mockSiteInfo, status: undefined});

        expect(treeItem.contextValue).to.be.equal("otherSite");
    });

    it('should have the expected description when site is current', () => {
        const treeItem = new SiteTreeItem({ ...mockSiteInfo, isCurrent: true });

        expect(treeItem.description).to.be.equal("Current");
    });

    it('should have the expected description when site is not current', () => {
        const treeItem = new SiteTreeItem(mockSiteInfo);

        expect(treeItem.description).to.be.equal("");
    });

    it('should have the siteInfo property set to the site info passed in the constructor', () => {
        const siteInfo = mockSiteInfo as IWebsiteInfo;
        const treeItem = new SiteTreeItem(siteInfo);

        expect(treeItem.siteInfo).to.deep.equal(siteInfo);
    });
});
