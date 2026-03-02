/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";

class MockTreeItem extends ActionsHubTreeItem {
    constructor(label: string | null = "Foo") {
        super(
            label,
            vscode.TreeItemCollapsibleState.Collapsed,
            "iconPath",
            "contextValue",
            "describe"
        );
    }
}

describe('ActionsHubTreeItem', () => {
    it('should be of type vscode.TreeItem', () => {
        const treeItem = new MockTreeItem();

        expect(treeItem).to.be.instanceOf(vscode.TreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new MockTreeItem();

        expect(treeItem.label).to.be.equal("Foo");
    });

    it('should have expected label when null is passed', () => {
        const treeItem = new MockTreeItem(null);

        expect(treeItem.tooltip).to.be.equal("");
    });

    it('should have the expected collapsible state', () => {
        const treeItem = new MockTreeItem();

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Collapsed);
    });

    it('should have the expected icon path', () => {
        const treeItem = new MockTreeItem();

        expect(treeItem.iconPath).to.be.equal("iconPath");
    });

    it('should have the expected context value', () => {
        const treeItem = new MockTreeItem();

        expect(treeItem.contextValue).to.be.equal("contextValue");
    });

    it('should have the expected tooltip', () => {
        const treeItem = new MockTreeItem();

        expect(treeItem.tooltip).to.be.equal("Foo");
    });

    it('should have the expected description', () => {
        const treeItem = new MockTreeItem();

        expect(treeItem.description).to.be.equal("describe");
    });
});
