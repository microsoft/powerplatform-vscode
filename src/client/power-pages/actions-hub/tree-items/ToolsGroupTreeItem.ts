/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";

export class ToolsGroupTreeItem extends ActionsHubTreeItem {
    constructor() {
        super(
            Constants.Strings.TOOLS,
            vscode.TreeItemCollapsibleState.Expanded,
            Constants.Icons.TOOLS,
            Constants.ContextValues.TOOLS_GROUP
        );
    }

    public getChildren(): ActionsHubTreeItem[] {
        // Return empty array for now - children can be added later
        return [];
    }
}
