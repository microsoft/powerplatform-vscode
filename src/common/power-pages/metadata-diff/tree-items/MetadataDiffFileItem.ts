/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffTreeItem } from "./MetadataDiffTreeItem";

export class MetadataDiffFileItem extends MetadataDiffTreeItem {
    constructor(label: string, workspaceFilePath: string, storedFilePath: string) {
        super(label, vscode.TreeItemCollapsibleState.None, "file", workspaceFilePath);

        const workspaceUri = vscode.Uri.file(workspaceFilePath);
        const storedUri = vscode.Uri.file(storedFilePath);

        this.resourceUri = workspaceUri;
        this.command = {
            command: "vscode.diff",
            title: "Compare Changes",
            arguments: [storedUri, workspaceUri, `Diff: ${label}`]
        };
        this.iconPath = new vscode.ThemeIcon("file");
    }
}
