/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

export class MetadataDiffTreeItem extends vscode.TreeItem {
    private _childrenMap: Map<string, MetadataDiffTreeItem>;

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        public readonly filePath?: string, // Workspace file path
        public readonly storedFilePath?: string // Backup copy path
    ) {
        super(label, collapsibleState);
        this._childrenMap = new Map<string, MetadataDiffTreeItem>();
        this.contextValue = contextValue;
        this.iconPath = collapsibleState === vscode.TreeItemCollapsibleState.None ?
            new vscode.ThemeIcon("file") :
            new vscode.ThemeIcon("folder");
        this.tooltip = this.label;

        if (filePath && storedFilePath) {
            this.command = {
                command: "microsoft.powerplatform.pages.metadataDiff.openDiff",
                title: "Open Diff",
                arguments: [filePath, storedFilePath] // Pass file paths to the command
            };
        }
    }

    public getChildren(): MetadataDiffTreeItem[] {
        return Array.from(this._childrenMap.values());
    }

    public getChildrenMap(): Map<string, MetadataDiffTreeItem> {
        return this._childrenMap;
    }
}
