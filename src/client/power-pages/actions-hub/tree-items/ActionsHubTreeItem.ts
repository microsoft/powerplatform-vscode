/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

export abstract class ActionsHubTreeItem extends vscode.TreeItem {
    constructor(
        label: string | null | undefined,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconPath: string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri } | vscode.ThemeIcon,
        public readonly contextValue: string,
        public readonly description: string = "",
    ) {
        super(label || "", collapsibleState);

        this.tooltip = label || "";
    }

    public getChildren(): ActionsHubTreeItem[] {
        return [];
    }
}
