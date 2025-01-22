/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants"
import { ActionsHubTreeItem } from "./ActionsHubTreeItem"

export class OtherSitesGroupTreeItem extends ActionsHubTreeItem {
    constructor() {
        super(
            Constants.Strings.OTHER_SITES,
            vscode.TreeItemCollapsibleState.Collapsed,
            Constants.Icons.OTHER_SITES,
            Constants.ContextValues.OTHER_SITES_GROUP
        )
    }
}
