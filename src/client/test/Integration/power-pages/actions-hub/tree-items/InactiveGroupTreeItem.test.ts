/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { InactiveGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/InactiveGroupTreeItem";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";

describe('InactiveGroupTreeItem', () => {
    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new InactiveGroupTreeItem();

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new InactiveGroupTreeItem();

        expect(treeItem.label).to.be.equal("Inactive Sites");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new InactiveGroupTreeItem();

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Collapsed);
    });

    it('should have the expected icon', () => {
        const treeItem = new InactiveGroupTreeItem();

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('folder');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new InactiveGroupTreeItem();

        expect(treeItem.contextValue).to.be.equal("inactiveSitesGroup");
    });
});
