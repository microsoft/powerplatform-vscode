/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "../ActionsHubTreeItem";
import { Constants } from "../../Constants";
import { MetadataDiffFileTreeItem } from "./MetadataDiffFileTreeItem";

/**
 * Tree item representing a folder in the metadata diff comparison
 */
export class MetadataDiffFolderTreeItem extends ActionsHubTreeItem {
    public readonly childrenMap: Map<string, MetadataDiffFolderTreeItem | MetadataDiffFileTreeItem>;

    constructor(folderName: string) {
        super(
            folderName,
            vscode.TreeItemCollapsibleState.Expanded,
            Constants.Icons.METADATA_DIFF_FOLDER,
            Constants.ContextValues.METADATA_DIFF_FOLDER
        );
        this.childrenMap = new Map();
    }

    public getChildren(): ActionsHubTreeItem[] {
        return Array.from(this.childrenMap.values());
    }
}
