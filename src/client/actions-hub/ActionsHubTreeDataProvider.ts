/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { Constants } from "./Constants";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];

    private constructor() {
        this._disposables.push(
            vscode.window.registerTreeDataProvider("powerpages.actionsHub", this)
        );
    }

    public static initialize(): ActionsHubTreeDataProvider {
        return new ActionsHubTreeDataProvider();
    }

    getTreeItem(element: ActionsHubTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ActionsHubTreeItem | undefined): vscode.ProviderResult<ActionsHubTreeItem[]> {
        if (!element) {
            return [
                new ActionsHubTreeItem(
                    Constants.Strings.OTHER_SITES,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    Constants.Icons.OTHER_SITES,
                    Constants.ContextValues.OTHER_SITES_GROUP
                )
            ];
        } else {
            return [];
        }
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }
}
