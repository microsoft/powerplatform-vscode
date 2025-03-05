/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffTreeItem } from "./MetadataDiffTreeItem";

export class MetadataDiffFileItem extends MetadataDiffTreeItem {
    public readonly workspaceFile?: string;
    public readonly storageFile?: string;
    public readonly hasDiff: boolean;

    constructor(label: string, workspaceFile?: string, storageFile?: string, hasDiff = true) {
        super(label, vscode.TreeItemCollapsibleState.None, "metadataDiffFileItem");
        this.workspaceFile = workspaceFile;
        this.storageFile = storageFile;
        this.hasDiff = hasDiff;

        const workspaceUri = workspaceFile ? vscode.Uri.file(workspaceFile) : vscode.Uri.parse(`untitled:${label} (Deleted)`);
        const storedUri = storageFile ? vscode.Uri.file(storageFile) : vscode.Uri.parse(`untitled:${label} (Deleted)`);

        this.resourceUri = workspaceUri;
        this.command = {
            command: 'vscode.diff',
            title: 'Show Diff',
            arguments: [storedUri, workspaceUri, `${label} (Diff)`]
        };
    }
}
