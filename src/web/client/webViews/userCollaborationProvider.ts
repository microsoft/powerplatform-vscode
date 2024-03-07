/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import * as Constants from "../common/constants";

export class UserCollaborationProvider
    implements vscode.TreeDataProvider<UserNode>
{
    private _onDidChangeTreeData: vscode.EventEmitter<
        UserNode | undefined | void
    > = new vscode.EventEmitter<UserNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<UserNode | undefined | void> =
        this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: UserNode): vscode.TreeItem {
        return element;
    }

    getChildren(): Thenable<UserNode[]> {
        return Promise.resolve(this.getConnectedUsers());
    }

    getConnectedUsers(): UserNode[] {
        const connectedUsersMap = WebExtensionContext.connectedUsers.getUserMap;
        const connectedUsers: UserNode[] = Array.from(
            connectedUsersMap.entries()
        ).map(([, value]) => {
            return new UserNode(
                value._userName,
                value._userId,
                vscode.TreeItemCollapsibleState.None
            );
        });

        return connectedUsers;
    }
}

export class UserNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);

        this.tooltip = this.label;
        this.iconPath = new vscode.ThemeIcon(Constants.THEME_ICON_ACCOUNT);
    }

    contextValue = Constants.USER_COLLABORATION_CONTEXT_VALUE;
}
