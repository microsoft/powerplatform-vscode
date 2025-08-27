/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { Constants } from "../Constants";
import { LoginPromptTreeItem } from "./LoginPromptTreeItem";

export class AccountMismatchTreeItem extends ActionsHubTreeItem {
    constructor() {
        super(
            Constants.Strings.ACCOUNT_MISMATCH_DETECTED,
            vscode.TreeItemCollapsibleState.Expanded,
            new vscode.ThemeIcon("warning"),
            Constants.ContextValues.ACCOUNT_MISMATCH,
            Constants.Strings.ACCOUNT_MISMATCH_DESCRIPTION
        );
        this.tooltip = Constants.Strings.ACCOUNT_MISMATCH_TOOLTIP;
    }

    public getChildren(): ActionsHubTreeItem[] {
        return [
            new LoginPromptTreeItem()
        ];
    }
}

