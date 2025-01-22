/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";

export class NoDataTreeItem extends ActionsHubTreeItem {
    constructor() {
        super(
            Constants.Strings.NO_SITES_FOUND,
            vscode.TreeItemCollapsibleState.None,
            "",
            Constants.ContextValues.NO_SITES
        )
    }
}
