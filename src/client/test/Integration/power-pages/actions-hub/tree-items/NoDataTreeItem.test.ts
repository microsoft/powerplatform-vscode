/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { NoDataTreeItem } from "../../../../../power-pages/actions-hub/tree-items/NoDataTreeItem";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";

describe('NoDataTreeItem', () => {
    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new NoDataTreeItem();

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new NoDataTreeItem();

        expect(treeItem.label).to.be.equal("No sites found");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new NoDataTreeItem();

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.None);
    });

    it('should have the expected icon', () => {
        const treeItem = new NoDataTreeItem();

        expect(treeItem.iconPath).to.be.equal('');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new NoDataTreeItem();

        expect(treeItem.contextValue).to.be.equal("noSites");
    });
});
