/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";

export class InactiveGroupTreeItem extends ActionsHubTreeItem {
    constructor() {
        super(
            Constants.Strings.INACTIVE_SITES,
            vscode.TreeItemCollapsibleState.Collapsed,
            Constants.Icons.SITE_GROUP,
            Constants.ContextValues.INACTIVE_SITES_GROUP
        )
    }
}
