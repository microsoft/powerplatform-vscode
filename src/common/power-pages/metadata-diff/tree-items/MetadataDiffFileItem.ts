/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffTreeItem } from "./MetadataDiffTreeItem";

export class MetadataDiffFileItem extends MetadataDiffTreeItem {
    constructor(label: string, workspaceFile?: string, storageFile?: string, hasDiff = true) {
        super(
            label,
            vscode.TreeItemCollapsibleState.None,
            "metadataDiffFileItem",
            workspaceFile,
            storageFile
        );
        this.workspaceFile = workspaceFile;
        this.storageFile = storageFile;
        this.hasDiff = hasDiff;
        this.iconPath = new vscode.ThemeIcon("file");

        if (hasDiff && (workspaceFile || storageFile)) {
            this.command = {
                command: 'metadataDiff.openDiff',
                title: 'Show Diff',
                arguments: [workspaceFile, storageFile]
            };
        }
    }

    public readonly workspaceFile?: string;
    public readonly storageFile?: string;
    public readonly hasDiff: boolean;
}
