/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "../ActionsHubTreeItem";
import { Constants } from "../../Constants";
import { IFileComparisonResult } from "../../models/IFileComparisonResult";
import { MetadataDiffFileTreeItem } from "./MetadataDiffFileTreeItem";
import { MetadataDiffFolderTreeItem } from "./MetadataDiffFolderTreeItem";

/**
 * Root group tree item for showing metadata diff comparison results
 */
export class MetadataDiffGroupTreeItem extends ActionsHubTreeItem {
    private readonly _comparisonResults: IFileComparisonResult[];
    private readonly _siteName: string;

    constructor(comparisonResults: IFileComparisonResult[], siteName: string) {
        super(
            vscode.l10n.t("{0} ({1} change(s))", Constants.Strings.METADATA_DIFF_GROUP, comparisonResults.length),
            vscode.TreeItemCollapsibleState.Expanded,
            Constants.Icons.METADATA_DIFF_GROUP,
            Constants.ContextValues.METADATA_DIFF_GROUP,
            siteName // Show the website name as subtext
        );
        this._comparisonResults = comparisonResults;
        this._siteName = siteName;
    }

    public getChildren(): ActionsHubTreeItem[] {
        return this.buildTreeHierarchy();
    }

    /**
     * Build a hierarchical tree structure from flat file comparison results
     */
    private buildTreeHierarchy(): ActionsHubTreeItem[] {
        // Create a map to hold folder structures at the root level
        const rootChildren = new Map<string, MetadataDiffFolderTreeItem | MetadataDiffFileTreeItem>();

        for (const result of this._comparisonResults) {
            const parts = result.relativePath.split(/[/\\]/);
            let currentFolder: MetadataDiffFolderTreeItem | undefined;

            // Process all parts except the last one (which is the file name)
            for (let i = 0; i < parts.length - 1; i++) {
                const folderName = parts[i];

                if (i === 0) {
                    // Look in root children
                    let folder = rootChildren.get(folderName) as MetadataDiffFolderTreeItem | undefined;
                    if (!folder) {
                        folder = new MetadataDiffFolderTreeItem(folderName);
                        rootChildren.set(folderName, folder);
                    }
                    currentFolder = folder;
                } else if (currentFolder) {
                    // Look in current folder's children
                    let folder = currentFolder.childrenMap.get(folderName) as MetadataDiffFolderTreeItem | undefined;
                    if (!folder) {
                        folder = new MetadataDiffFolderTreeItem(folderName);
                        currentFolder.childrenMap.set(folderName, folder);
                    }
                    currentFolder = folder;
                }
            }

            // Add the file to the appropriate folder (or root if no folders)
            const fileName = parts[parts.length - 1];
            const fileItem = new MetadataDiffFileTreeItem(
                fileName,
                result,
                this._siteName
            );

            if (currentFolder) {
                currentFolder.childrenMap.set(fileName, fileItem);
            } else {
                rootChildren.set(fileName, fileItem);
            }
        }

        return Array.from(rootChildren.values());
    }

    public get siteName(): string {
        return this._siteName;
    }

    public get comparisonResults(): IFileComparisonResult[] {
        return this._comparisonResults;
    }
}
