/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { IEntityInfo } from "../common/interfaces";

export class QuickPickProvider {
    private items: vscode.QuickPickItem[] = [];

    constructor() {
        this.items = new Array<vscode.QuickPickItem>();
    }

    public updateQuickPickItems(entityInfo: IEntityInfo) {
        const connectedUsersMap = WebExtensionContext.connectedUsers.getUserMap;

        this.items = Array.from(
            connectedUsersMap.entries()
        ).map(([, value]) => {
            return {
                label: value._userName,
            };
        });
    }

    public showQuickPick() {
        vscode.window.showQuickPick(this.items);
    }
}
