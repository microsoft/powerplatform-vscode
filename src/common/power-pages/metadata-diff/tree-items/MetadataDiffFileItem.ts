/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffTreeItem } from "./MetadataDiffTreeItem";

export class MetadataDiffFileItem extends MetadataDiffTreeItem {
    constructor(label: string, workspaceFile?: string, storageFile?: string, hasDiff = true, relativePath?: string) {
        // Derive a more specific context value so that modified items can have dedicated menu actions
        let contextValue = "metadataDiffFileItem"; // default
        if (workspaceFile && storageFile) {
            contextValue = "metadataDiffFileModified"; // both sides exist and differ
        } else if (workspaceFile && !storageFile) {
            contextValue = "metadataDiffFileOnlyLocal";
        } else if (!workspaceFile && storageFile) {
            contextValue = "metadataDiffFileOnlyRemote";
        }

        super(
            label,
            vscode.TreeItemCollapsibleState.None,
            contextValue,
            workspaceFile,
            storageFile
        );
    // Mirror to base properties so wrapper can access via reflection
    this.workspaceFile = workspaceFile;
    this.storageFile = storageFile;
    (this as unknown as { filePath?: string }).filePath = workspaceFile;
    (this as unknown as { storedFilePath?: string }).storedFilePath = storageFile;
    // Keep relative path even if a side is missing so commands (discard/import) can resolve target
    (this as unknown as { relativePath?: string }).relativePath = relativePath;
        this.hasDiff = hasDiff;
        this.iconPath = new vscode.ThemeIcon("file");

        if (hasDiff && (workspaceFile || storageFile)) {
            this.command = {
                command: 'microsoft.powerplatform.pages.metadataDiff.openDiff',
                title: 'Show Diff',
                arguments: [workspaceFile, storageFile]
            };
        }
    }

    public readonly workspaceFile?: string;
    public readonly storageFile?: string;
    public readonly hasDiff: boolean;
    // relative path within the website/site root
    public readonly relativePath?: string;
}
