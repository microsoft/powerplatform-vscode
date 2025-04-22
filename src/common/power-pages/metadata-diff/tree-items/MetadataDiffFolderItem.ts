/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffTreeItem } from "./MetadataDiffTreeItem";

export class MetadataDiffFolderItem extends MetadataDiffTreeItem {
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded) {
        super(label, collapsibleState, "folder");
        this.iconPath = new vscode.ThemeIcon("folder");
    }
}
