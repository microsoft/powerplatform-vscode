/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { ActiveGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActiveGroupTreeItem";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";

describe('ActiveGroupTreeItem', () => {
    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new ActiveGroupTreeItem();

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new ActiveGroupTreeItem();

        expect(treeItem.label).to.be.equal("Active Sites");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new ActiveGroupTreeItem();

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Collapsed);
    });

    it('should have the expected icon', () => {
        const treeItem = new ActiveGroupTreeItem();

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('folder');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new ActiveGroupTreeItem();

        expect(treeItem.contextValue).to.be.equal("activeSitesGroup");
    });
});
