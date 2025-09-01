/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";

export class LoginPromptTreeItem extends ActionsHubTreeItem {
    constructor() {
        super(
            Constants.Strings.LOGIN_PROMPT_LABEL,
            vscode.TreeItemCollapsibleState.None,
            new vscode.ThemeIcon("account"),
            Constants.ContextValues.LOGIN_PROMPT,
            ""
        );
        this.command = {
            command: 'microsoft.powerplatform.pages.actionsHub.loginToMatch',
            title: Constants.Strings.LOGIN_PROMPT_TITLE,
        };
        this.tooltip = Constants.Strings.LOGIN_PROMPT_TOOLTIP;
    }

    public getChildren(): ActionsHubTreeItem[] {
        return [];
    }
}
