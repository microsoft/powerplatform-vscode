/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { MetadataDiffTreeItem } from "../../../../common/power-pages/metadata-diff/tree-items/MetadataDiffTreeItem";

/**
 * Wrapper tree item for metadata diff entries to integrate with existing Actions Hub tree.
 */
export class MetadataDiffWrapperTreeItem extends ActionsHubTreeItem {
    constructor(private readonly _item: MetadataDiffTreeItem) {
        super(
            _item.label?.toString(),
            _item.collapsibleState ?? vscode.TreeItemCollapsibleState.None,
            _item.iconPath || new vscode.ThemeIcon("file"),
            _item.contextValue || "metadataDiffItem",
            (typeof _item.description === "string" ? _item.description : "")
        );
        this.command = _item.command;
        this.tooltip = _item.tooltip;
    }

    public get filePath(): string | undefined {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this._item as any).filePath;
    }

    public get storedFilePath(): string | undefined {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this._item as any).storedFilePath;
    }

    public getChildren(): ActionsHubTreeItem[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const children: MetadataDiffTreeItem[] = (this._item as any).getChildren ? (this._item as any).getChildren() : [];
        if (!children || !Array.isArray(children)) {
            return [];
        }
        return children.map(c => new MetadataDiffWrapperTreeItem(c));
    }
}
