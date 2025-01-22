/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { Constants } from "../Constants";

export class ActiveGroupTreeItem extends ActionsHubTreeItem {
    constructor() {
        super(
            Constants.Strings.ACTIVE_SITES,
            vscode.TreeItemCollapsibleState.Collapsed,
            Constants.Icons.SITE_GROUP,
            Constants.ContextValues.ACTIVE_SITES_GROUP
        )
    }
}
