/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";

export class PowerPagesPeopleOnTheSiteProvider
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
                vscode.TreeItemCollapsibleState.None
            );
        });

        return connectedUsers;
    }

    openTeamsChat(): void {
        console.log("Open Teams chat");
    }

    openMail(): void {
        console.log("Open mail");
    }
}

export class UserNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);

        this.tooltip = this.label;
        this.iconPath = new vscode.ThemeIcon("account");
    }

    contextValue = "userNode";
}
