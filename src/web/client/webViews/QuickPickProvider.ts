/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { IEntityInfo } from "../common/interfaces";
import * as Constants from "../common/constants";
import { getFileEntityId, getFileEntityName, getFileRootWebPageId } from "../utilities/fileAndEntityUtil";

interface IQuickPickItem extends vscode.QuickPickItem {
    label: string;
    id?: string;
}

export class QuickPickProvider {
    private items: IQuickPickItem[] = [];

    constructor() {
        this.items = new Array<IQuickPickItem>();
    }

    public refresh() {
        const tabGroup = vscode.window.tabGroups;
        if (tabGroup.activeTabGroup && tabGroup.activeTabGroup.activeTab) {
            const tab = tabGroup.activeTabGroup.activeTab;
            if (tab.input instanceof vscode.TabInputCustom || tab.input instanceof vscode.TabInputText) {
                const fileFsPath = tab.input.uri.fsPath;
                const entityInfo: IEntityInfo = {
                    entityId: getFileEntityId(fileFsPath),
                    entityName: getFileEntityName(fileFsPath),
                    rootWebPageId: getFileRootWebPageId(fileFsPath),
                };
                this.updateQuickPickItems(entityInfo);
            }
        }
    }

    public async updateQuickPickItems(entityInfo: IEntityInfo) {
        const connectedUsersMap = WebExtensionContext.connectedUsers.getUserMap;
        const userMap = new Map<string, IQuickPickItem>();

        for (const [, value] of connectedUsersMap.entries()) {
            for (const connection of value._connectionData) {
                // List all the user connections except the current connection
                if (connection.connectionId !== WebExtensionContext.currentConnectionId) {
                    const contentPageId = WebExtensionContext.entityForeignKeyDataMap.getEntityForeignKeyMap.get(`${connection.entityId[0]}`);

                    // if content is localized, then check for the content page id
                    if ((connection.entityId[0] === entityInfo.entityId) || (contentPageId && contentPageId.has(`${entityInfo.entityId}`))) {
                        userMap.set(value._userId, {
                            label: value._userName,
                            id: value._userId,
                        });
                    }
                }
            }
        }

        const currentUsers = Array.from(userMap.values());

        this.items = currentUsers.length ? currentUsers : [{
            label: Constants.WEB_EXTENSION_QUICK_PICK_DEFAULT_STRING,
            id: "",
        }];
    }

    private getLength(): number {
        if (this.items.length === 1 && this.items[0].label === Constants.WEB_EXTENSION_QUICK_PICK_DEFAULT_STRING) {
            return 0;
        }

        return this.items.length;
    }

    public async showQuickPick() {
        const selectedUser = await vscode.window.showQuickPick(this.items, {
            title: vscode.l10n.t(Constants.WEB_EXTENSION_QUICK_PICK_TITLE.toUpperCase() + ` (${this.getLength()})`),
            placeHolder: vscode.l10n.t(Constants.WEB_EXTENSION_QUICK_PICK_PLACEHOLDER),
        });
        if (selectedUser) {
            this.handleSelectedOption(selectedUser);
        }
    }

    private handleSelectedOption(selectedOption: IQuickPickItem) {
        this.collaborationQuickPick(selectedOption);
    }

    public async collaborationQuickPick(selectedOption: IQuickPickItem) {
        const collaborationOptions: IQuickPickItem[] = [
            {
                label: Constants.START_TEAMS_CHAT,
                iconPath: {
                    light: vscode.Uri.joinPath(WebExtensionContext.extensionUri, 'src', 'web', 'client', 'assets', 'microsoftTeamsIcon', 'light', 'microsoftTeams.svg'),
                    dark: vscode.Uri.joinPath(WebExtensionContext.extensionUri, 'src', 'web', 'client', 'assets', 'microsoftTeamsIcon', 'dark', 'microsoftTeams.svg'),
                }
            },
            {
                label: Constants.SEND_AN_EMAIL,
                iconPath: new vscode.ThemeIcon(Constants.THEME_ICON_MAIL),
            },
        ];

        const collaborationOptionsSelected = await vscode.window.showQuickPick(collaborationOptions, {
            title: vscode.l10n.t(Constants.WEB_EXTENSION_COLLABORATION_OPTIONS_CONTACT.toUpperCase() + ` ${selectedOption.label.toUpperCase()}`),
        });

        if (collaborationOptionsSelected) {
            if (collaborationOptionsSelected.label === Constants.START_TEAMS_CHAT) {
                if (selectedOption.id) {
                    WebExtensionContext.openTeamsChat(selectedOption.id);
                } else {
                    vscode.window.showInformationMessage(Constants.WEB_EXTENSION_TEAMS_CHAT_NOT_AVAILABLE);
                }
            } else if (collaborationOptionsSelected.label === Constants.SEND_AN_EMAIL) {
                if (selectedOption.id) {
                    WebExtensionContext.openMail(selectedOption.id);
                } else {
                    vscode.window.showInformationMessage(Constants.WEB_EXTENSION_SEND_EMAIL_NOT_AVAILABLE);
                }
            }
        }
    }
}
