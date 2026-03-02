/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { OtherSitesGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/OtherSitesGroupTreeItem";

describe('OtherSitesGroupTreeItem', () => {
    it('should be of type ActionsHubTreeItem', () => {
        const treeItem = new OtherSitesGroupTreeItem([]);

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new OtherSitesGroupTreeItem([]);

        expect(treeItem.label).to.be.equal("Other Sites");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new OtherSitesGroupTreeItem([]);

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Collapsed);
    });

    it('should have the expected icon', () => {
        const treeItem = new OtherSitesGroupTreeItem([]);

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('archive');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new OtherSitesGroupTreeItem([]);

        expect(treeItem.contextValue).to.be.equal("otherSitesGroup");
    });
});
