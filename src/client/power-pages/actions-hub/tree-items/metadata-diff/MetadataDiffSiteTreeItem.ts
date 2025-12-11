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
import MetadataDiffContext from "../../MetadataDiffContext";

/**
 * Tree item representing a single website's metadata diff results.
 * This is a child of MetadataDiffGroupTreeItem and contains the actual diff files.
 */
export class MetadataDiffSiteTreeItem extends ActionsHubTreeItem {
    private readonly _comparisonResults: IFileComparisonResult[];
    private readonly _siteName: string;
    private readonly _environmentName: string;

    constructor(comparisonResults: IFileComparisonResult[], siteName: string, environmentName: string) {
        const fileCount = comparisonResults.length;
        const fileLabel = fileCount === 1
            ? Constants.StringFunctions.SITE_WITH_FILE_COUNT_SINGULAR(siteName, fileCount)
            : Constants.StringFunctions.SITE_WITH_FILE_COUNT_PLURAL(siteName, fileCount);
        super(
            fileLabel,
            vscode.TreeItemCollapsibleState.Expanded,
            Constants.Icons.SITE,
            Constants.ContextValues.METADATA_DIFF_SITE,
            environmentName // Show environment name as description/subtext
        );
        this._comparisonResults = comparisonResults;
        this._siteName = siteName;
        this._environmentName = environmentName;
    }

    public getChildren(): ActionsHubTreeItem[] {
        if (MetadataDiffContext.isTreeView) {
            return this.buildTreeHierarchy();
        }
        return this.buildFlatFileList();
    }

    /**
     * Build a flat list of file tree items (Git-style list view).
     * Files are sorted by folder path, then by file name.
     */
    private buildFlatFileList(): ActionsHubTreeItem[] {
        // Sort results by relative path for consistent ordering
        const sortedResults = [...this._comparisonResults].sort((a, b) =>
            a.relativePath.localeCompare(b.relativePath)
        );

        // Create flat list of file items
        return sortedResults.map(result =>
            new MetadataDiffFileTreeItem(result, this._siteName)
        );
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
            const fileItem = new MetadataDiffFileTreeItem(
                result,
                this._siteName
            );

            if (currentFolder) {
                currentFolder.childrenMap.set(result.relativePath, fileItem);
            } else {
                rootChildren.set(result.relativePath, fileItem);
            }
        }

        return Array.from(rootChildren.values());
    }

    public get siteName(): string {
        return this._siteName;
    }

    public get environmentName(): string {
        return this._environmentName;
    }

    public get comparisonResults(): IFileComparisonResult[] {
        return this._comparisonResults;
    }
}
