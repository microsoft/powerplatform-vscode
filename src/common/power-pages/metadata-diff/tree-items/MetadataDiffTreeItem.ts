/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

export abstract class MetadataDiffTreeItem extends vscode.TreeItem {
    protected _children: Map<string, MetadataDiffTreeItem> = new Map();

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly filePath?: string, // Workspace file path
        public readonly storedFilePath?: string // Backup copy path
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;

        if (filePath && storedFilePath) {
            this.command = {
                command: "metadataDiff.openDiff",
                title: "Open Diff",
                arguments: [filePath, storedFilePath] // Pass file paths to the command
            };
        }
    }

    public getChildren(): MetadataDiffTreeItem[] {
        return Array.from(this._children.values());
    }

    public getChildrenMap(): Map<string, MetadataDiffTreeItem> {
        return this._children;
    }
}
