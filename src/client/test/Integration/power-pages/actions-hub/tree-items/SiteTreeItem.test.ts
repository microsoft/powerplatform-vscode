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

describe('SiteTreeItem', () => {
    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo", isCurrent: false, siteVisibility: "Private" });

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo", isCurrent: false, siteVisibility: "Private" });

        expect(treeItem.label).to.be.equal("Test Site");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo", isCurrent: false, siteVisibility: "Private" });

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.None);
    });

    it('should have the expected icon', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo", isCurrent: false, siteVisibility: "Private" });

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('globe');
    });

    it('should have the expected contextValue when the site is Active and current', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo", isCurrent: true, siteVisibility: "Private" });

        expect(treeItem.contextValue).to.be.equal("currentActiveSite");
    });

    it('should have the expected contextValue when the site is Active and not current', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo", isCurrent: false, siteVisibility: "Private" });

        expect(treeItem.contextValue).to.be.equal("nonCurrentActiveSite");
    });

    it('should have the expected contextValue when the site is Inactive', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: WebsiteStatus.Inactive, websiteUrl: "https://foo", isCurrent: false, siteVisibility: "Private" });

        expect(treeItem.contextValue).to.be.equal("inactiveSite");
    });

    it('should have the expected contextValue when the site is neither Active nor Inactive', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: undefined, websiteUrl: "https://foo", isCurrent: false, siteVisibility: "Private" });

        expect(treeItem.contextValue).to.be.equal("otherSite");
    });

    it('should have the expected description when site is current', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: undefined, websiteUrl: "https://foo", isCurrent: true, siteVisibility: "Private" });

        expect(treeItem.description).to.be.equal("Current");
    });

    it('should have the expected description when site is not current', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: undefined, websiteUrl: "https://foo", isCurrent: false, siteVisibility: "Private" });

        expect(treeItem.description).to.be.equal("");
    });

    it('should have the siteInfo property set to the site info passed in the constructor', () => {
        const siteInfo = { name: "Test Site", websiteId: 'test-id', dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo", isCurrent: false, siteVisibility: "Private" } as IWebsiteInfo;
        const treeItem = new SiteTreeItem(siteInfo);

        expect(treeItem.siteInfo).to.deep.equal(siteInfo);
    });
});
