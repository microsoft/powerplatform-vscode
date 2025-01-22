/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";

class MockTreeItem extends ActionsHubTreeItem {
    constructor() {
        super(
            "Foo",
            vscode.TreeItemCollapsibleState.Collapsed,
            "iconPath",
            "contextValue"
        );
    }
}

describe('ActionsHubTreeItem', () => {
    it('should be of type vscode.TreeItem', () => {
        const treeItem = new MockTreeItem();

        expect(treeItem).to.be.instanceOf(vscode.TreeItem);
    });

    it('should have the expected tooltip', () => {
        const treeItem = new MockTreeItem();

        expect(treeItem.tooltip).to.be.equal("Foo");
    });
});
