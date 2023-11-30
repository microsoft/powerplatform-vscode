/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { IEntityInfo } from "../common/interfaces";
import * as Constants from "../common/constants";

export class QuickPickProvider {
    private items: vscode.QuickPickItem[] = [];

    constructor() {
        this.items = new Array<vscode.QuickPickItem>();
    }

    public async updateQuickPickItems(entityInfo: IEntityInfo) {
        const connectedUsersMap = WebExtensionContext.connectedUsers.getUserMap;

        const currentUsers: vscode.QuickPickItem[] = [];

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
            }];
        }
    }

    public showQuickPick() {
        vscode.window.showQuickPick(this.items);
    }
}
