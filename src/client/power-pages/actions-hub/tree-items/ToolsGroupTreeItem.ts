/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { ActionsHub } from "../ActionsHub";
import { MetadataDiffGroupTreeItem } from "./metadata-diff/MetadataDiffGroupTreeItem";

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
        const children: ActionsHubTreeItem[] = [];

        // Add metadata diff group if the feature is enabled
        if (ActionsHub.isMetadataDiffEnabled()) {
            children.push(new MetadataDiffGroupTreeItem());
        }

        return children;
    }
}
