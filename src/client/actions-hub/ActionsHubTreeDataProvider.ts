/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {

    getTreeItem(element: ActionsHubTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ActionsHubTreeItem | undefined): vscode.ProviderResult<ActionsHubTreeItem[]> {
        if (element) {
            return element.children;
        } else {
            return [
                new ActionsHubTreeItem(
                    "Environment Group",
                    vscode.TreeItemCollapsibleState.Expanded,
                    { light: "light/path/to/icon.svg", dark: "dark/path/to/icon.svg" },
                    "environmentGroup"
                ),
                new ActionsHubTreeItem(
                    "Active Sites Group",
                    vscode.TreeItemCollapsibleState.Expanded,
                    { light: "light/path/to/icon.svg", dark: "dark/path/to/icon.svg" },
                    "activeSitesGroup"
                ),
                new ActionsHubTreeItem(
                    "Inactive Sites Group",
                    vscode.TreeItemCollapsibleState.Expanded,
                    { light: "light/path/to/icon.svg", dark: "dark/path/to/icon.svg" },
                    "inactiveSitesGroup"
                )
            ];
        }
    }
}
