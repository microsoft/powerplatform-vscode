/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { ToolsGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ToolsGroupTreeItem";

describe('ToolsGroupTreeItem', () => {
    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new ToolsGroupTreeItem();

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new ToolsGroupTreeItem();

        expect(treeItem.label).to.be.equal("Tools");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new ToolsGroupTreeItem();

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Expanded);
    });

    it('should have the expected icon', () => {
        const treeItem = new ToolsGroupTreeItem();

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('tools');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new ToolsGroupTreeItem();

        expect(treeItem.contextValue).to.be.equal("toolsGroup");
    });

    it('should return empty children array', () => {
        const treeItem = new ToolsGroupTreeItem();

        expect(treeItem.getChildren()).to.be.an('array').that.is.empty;
    });
});
