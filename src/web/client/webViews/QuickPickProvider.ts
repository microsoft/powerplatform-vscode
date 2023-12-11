/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { IEntityInfo } from "../common/interfaces";
import * as Constants from "../common/constants";
import { GraphClientService } from "../services/graphClientService";

interface IQuickPickItem extends vscode.QuickPickItem {
    label: string;
    id?: string;
    iconPath?: string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri } | vscode.ThemeIcon;
}

export class QuickPickProvider {
    private items: IQuickPickItem[] = [];
    graphClientService: GraphClientService;

    constructor() {
        this.items = new Array<IQuickPickItem>();
        this.graphClientService = new GraphClientService();
    }

    public async updateQuickPickItems(entityInfo: IEntityInfo) {
        const connectedUsersMap = WebExtensionContext.connectedUsers.getUserMap;

        const currentUsers: IQuickPickItem[] = [];

        Array.from(
            connectedUsersMap.entries()
        ).map(([, value]) => {
            if (value._entityId.length) {
                value._entityId.forEach(async (entityId) => {
                    const contentPageId = WebExtensionContext.entityForeignKeyDataMap.getEntityForeignKeyMap.get(`${entityId}`);

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
        const selectedUSer = await vscode.window.showQuickPick(this.items);
        if (selectedUSer) {
            this.handleSelectedOption(selectedUSer);
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
                    light: '../assets/microsoftTeamsIcon/light/microsoftTeams.svg',
                    dark: '../assets/microsoftTeamsIcon/dark/microsoftTeams.svg',
                }
            },
            {
                label: Constants.SEND_AN_EMAIL,
                iconPath: Constants.THEME_ICON_MAIL
            },
        ];

        const collaborationOptionsSelected = await vscode.window.showQuickPick(collaborationOptions);

        if (collaborationOptionsSelected) {
            if (collaborationOptionsSelected.label === Constants.START_TEAMS_CHAT) {
                if (selectedOption.id) {
                    WebExtensionContext.openTeamsChat(selectedOption.id);
                }
            } else if (collaborationOptionsSelected.label === Constants.SEND_AN_EMAIL) {
                if (selectedOption.id) {
                    WebExtensionContext.openMail(selectedOption.id);
                }
            }
        }
    }
}
