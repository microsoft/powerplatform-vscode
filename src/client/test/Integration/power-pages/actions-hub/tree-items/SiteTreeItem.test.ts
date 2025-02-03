/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { SiteTreeItem } from "../../../../../power-pages/actions-hub/tree-items/SiteTreeItem";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { WebsiteStatus } from "../../../../../power-pages/actions-hub/models/WebsiteStatus";

describe('SiteTreeItem', () => {
    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo" });

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo" });

        expect(treeItem.label).to.be.equal("Test Site");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo" });

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.None);
    });

    it('should have the expected icon', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo" });

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('globe');
    });

    it('should have the expected contextValue when the site is Active', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", dataModelVersion: 1, status: WebsiteStatus.Active, websiteUrl: "https://foo" });

        expect(treeItem.contextValue).to.be.equal("activeSite");
    });

    it('should have the expected contextValue when the site is Inactive', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", dataModelVersion: 1, status: WebsiteStatus.Inactive, websiteUrl: "https://foo" });

        expect(treeItem.contextValue).to.be.equal("inactiveSite");
    });

    it('should have the expected contextValue when the site is neither Active nor Inactive', () => {
        const treeItem = new SiteTreeItem({ name: "Test Site", dataModelVersion: 1, status: undefined, websiteUrl: "https://foo" });

        expect(treeItem.contextValue).to.be.equal("otherSite");
    });
});
