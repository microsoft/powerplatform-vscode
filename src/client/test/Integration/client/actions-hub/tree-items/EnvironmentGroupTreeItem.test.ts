/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { ActionsHubTreeItem } from "../../../../../actions-hub/tree-items/ActionsHubTreeItem";
import { EnvironmentGroupTreeItem } from "../../../../../actions-hub/tree-items/EnvironmentGroupTreeItem";

describe('EnvironmentGroupTreeItem', () => {
    it('should be of type EnvironmentGroupTreeItem', () => {
        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext);

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext);

        expect(treeItem.label).to.be.equal("Test Environment");
    });

    it('should have the expected collapsibleState', () => {
        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext);

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Collapsed);
    });

    it('should have the expected icon', () => {
        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext);

        expect((treeItem.iconPath as vscode.Uri).path).to.be.equal('/src/client/assets/environment.svg');
    });

    it('should have the expected contextValue', () => {
        const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" }, { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext);

        expect(treeItem.contextValue).to.be.equal("environmentGroup");
    });
});
