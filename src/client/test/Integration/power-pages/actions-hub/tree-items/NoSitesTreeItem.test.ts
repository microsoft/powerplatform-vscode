/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { NoSitesTreeItem } from "../../../../../power-pages/actions-hub/tree-items/NoSitesTreeItem";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";

describe('NoSitesTreeItem', () => {
    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new NoSitesTreeItem();

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new NoSitesTreeItem();

        expect(treeItem.label).to.be.equal("No sites found");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new NoSitesTreeItem();

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.None);
    });

    it('should have the expected icon', () => {
        const treeItem = new NoSitesTreeItem();

        expect(treeItem.iconPath).to.be.equal('');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new NoSitesTreeItem();

        expect(treeItem.contextValue).to.be.equal("noSites");
    });
});
