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
    iconPath?: string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri } | vscode.ThemeIcon;
}

export class QuickPickProvider {
    private items: IQuickPickItem[] = [];

    constructor() {
        this.items = new Array<IQuickPickItem>();
    }

    public refresh() {
        if (vscode.window.activeTextEditor) {
            const fileFsPath = vscode.window.activeTextEditor.document.uri.fsPath;
            const entityInfo: IEntityInfo = {
                entityId: getFileEntityId(fileFsPath),
                entityName: getFileEntityName(fileFsPath),
                rootWebPageId: getFileRootWebPageId(fileFsPath),
            };
            this.updateQuickPickItems(entityInfo);
        }
    }

    public async updateQuickPickItems(entityInfo: IEntityInfo) {
        const connectedUsersMap = WebExtensionContext.connectedUsers.getUserMap;

        const currentUsers: IQuickPickItem[] = [];

        Array.from(
            connectedUsersMap.entries()
        ).map(([, value]) => {
            if (value._connectionData.length) {
                value._connectionData.forEach(async (connection) => {
                    const contentPageId = WebExtensionContext.entityForeignKeyDataMap.getEntityForeignKeyMap.get(`${connection.entityId[0]}`);

                    if (
                        contentPageId &&
                        contentPageId.has(`${entityInfo.entityId}`)
                    ) {
                        currentUsers.push({
                            label: value._userName,
                            id: value._userId,
                        });
                    }
                })
            }
        });

        if (currentUsers.length) {
            this.items = currentUsers;
        } else {
            this.items = [{
                label: Constants.WEB_EXTENSION_QUICK_PICK_DEFAULT_STRING,
                id: "",
            }];
        }
    }

    public async showQuickPick() {
        const selectedUser = await vscode.window.showQuickPick(this.items);
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
            title: `CONTACT ${selectedOption.label.toUpperCase()}`,
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
