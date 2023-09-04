/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";

export class TreeWebView implements vscode.TreeDataProvider<UserNode>, vscode.Disposable {
    private _onDidChangeTreeData: vscode.EventEmitter< UserNode | undefined | null | void > = new vscode.EventEmitter<UserNode | undefined | null | void>();

    readonly onDidChangeTreeData: vscode.Event< UserNode | undefined | null | void > = this._onDidChangeTreeData.event;

    private readonly _disposables: vscode.Disposable[] = [];

    constructor() {
        this._disposables.push(...this.registerPanel());
    }

    public dispose(): void {
        this._disposables.forEach((d) => d.dispose());
    }

    public getTreeItem(
        element: UserNode
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        const user = new UserNode(
            String(element.label),
            String(element.description),
            element.collapsibleState,
        );
        user.tooltip = String(element.label);
        return user;
    }

    getChildren(element?: UserNode): vscode.ProviderResult<UserNode[]> {
        if (element) {
            return [];
        } else {
            const connectedUsersMap =
                WebExtensionContext.connectedUsers.getUserMap;
            const connectedUsers: UserNode[] = Array.from(
                connectedUsersMap.entries()
            ).map(([, value]) => {
                return new UserNode(
                    value._userName,
                    value._fileName,
                );
            });

            return connectedUsers;
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    private registerPanel(): vscode.Disposable[] {
        return [vscode.window.registerTreeDataProvider("powerpages.treeWebView", this)];
    }
}

class UserNode extends vscode.TreeItem {
    constructor(
        label: string | vscode.TreeItemLabel,
        fileName: string,
        collapsibleState?: vscode.TreeItemCollapsibleState,
    ) {
        super(label, collapsibleState);
        this.tooltip = String(fileName);
        this.description = fileName;
    }
}
