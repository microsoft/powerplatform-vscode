/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { GraphClientService } from "../services/graphClientService";
import { getMailToPath, getTeamChatURL } from "../utilities/commonUtil";
import * as Constants from "../common/constants";

export class UserCollaborationProvider
    implements vscode.TreeDataProvider<UserNode>
{
    private graphClientService: GraphClientService;
    private _onDidChangeTreeData: vscode.EventEmitter<
        UserNode | undefined | void
    > = new vscode.EventEmitter<UserNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<UserNode | undefined | void> =
        this._onDidChangeTreeData.event;

    constructor() {
        this.graphClientService = new GraphClientService();
    }

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

    async openTeamsChat(userId: string): Promise<void> {
        const mail = await this.graphClientService.getUserEmail(userId);
        const teamsChatLink = getTeamChatURL(mail);
        vscode.env.openExternal(vscode.Uri.parse(teamsChatLink.href));
    }

    async openMail(userId: string): Promise<void> {
        const mail = await this.graphClientService.getUserEmail(userId);
        const mailToPath = getMailToPath(mail);
        vscode.env.openExternal(vscode.Uri.parse(mailToPath));
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
