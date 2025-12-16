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
    private readonly _siteName: string;
    private readonly _folderPath: string;

    constructor(folderName: string, siteName: string, folderPath: string) {
        super(
            folderName,
            vscode.TreeItemCollapsibleState.Expanded,
            Constants.Icons.METADATA_DIFF_FOLDER,
            Constants.ContextValues.METADATA_DIFF_FOLDER
        );
        this.childrenMap = new Map();
        this._siteName = siteName;
        this._folderPath = folderPath;
    }

    public getChildren(): ActionsHubTreeItem[] {
        const children = Array.from(this.childrenMap.values());

        // Separate folders and files
        const folders: MetadataDiffFolderTreeItem[] = [];
        const files: MetadataDiffFileTreeItem[] = [];

        for (const child of children) {
            if (child instanceof MetadataDiffFolderTreeItem) {
                folders.push(child);
            } else {
                files.push(child);
            }
        }

        // Sort folders alphabetically by label
        folders.sort((a, b) => (a.label as string).localeCompare(b.label as string));

        // Sort files alphabetically by label
        files.sort((a, b) => (a.label as string).localeCompare(b.label as string));

        // Return folders first, then files
        return [...folders, ...files];
    }

    public get siteName(): string {
        return this._siteName;
    }

    public get folderPath(): string {
        return this._folderPath;
    }

    /**
     * Recursively collects all file tree items under this folder
     */
    public getAllFileItems(): MetadataDiffFileTreeItem[] {
        const files: MetadataDiffFileTreeItem[] = [];
        for (const child of this.childrenMap.values()) {
            if (child instanceof MetadataDiffFileTreeItem) {
                files.push(child);
            } else if (child instanceof MetadataDiffFolderTreeItem) {
                files.push(...child.getAllFileItems());
            }
        }
        return files;
    }
}
