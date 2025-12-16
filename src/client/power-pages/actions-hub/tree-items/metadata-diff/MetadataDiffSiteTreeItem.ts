/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "../ActionsHubTreeItem";
import { Constants } from "../../Constants";
import { IFileComparisonResult, FileComparisonStatus, ISiteComparisonResults } from "../../models/IFileComparisonResult";
import { MetadataDiffFileTreeItem } from "./MetadataDiffFileTreeItem";
import { MetadataDiffFolderTreeItem } from "./MetadataDiffFolderTreeItem";
import MetadataDiffContext, { MetadataDiffSortMode } from "../../MetadataDiffContext";

/**
 * Tree item representing a single website's metadata diff results.
 * This is a child of MetadataDiffGroupTreeItem and contains the actual diff files.
 */
export class MetadataDiffSiteTreeItem extends ActionsHubTreeItem {
    private readonly _comparisonResults: IFileComparisonResult[];
    private readonly _siteName: string;
    private readonly _localSiteName: string;
    private readonly _environmentName: string;
    private readonly _websiteId: string;
    private readonly _environmentId: string;
    private readonly _isImported: boolean;
    private readonly _exportedAt?: string;

    constructor(siteResults: ISiteComparisonResults) {
        const fileCount = siteResults.comparisonResults.length;
        const isImported = siteResults.isImported ?? false;

        const fileLabel = Constants.StringFunctions.COMPARISON_LABEL(siteResults.siteName, siteResults.environmentName, siteResults.localSiteName);
        const description = fileCount === 1
            ? Constants.Strings.FILE_COUNT_DESCRIPTION_SINGULAR
            : Constants.StringFunctions.FILE_COUNT_DESCRIPTION_PLURAL(fileCount);

        // Use different icons and context values for imported vs live comparisons
        const icon = isImported ? Constants.Icons.IMPORTED_SITE : Constants.Icons.SITE;
        const contextValue = isImported ? Constants.ContextValues.METADATA_DIFF_SITE_IMPORTED : Constants.ContextValues.METADATA_DIFF_SITE;

        super(
            fileLabel,
            vscode.TreeItemCollapsibleState.Expanded,
            icon,
            contextValue,
            description
        );
        this._comparisonResults = siteResults.comparisonResults;
        this._siteName = siteResults.siteName;
        this._localSiteName = siteResults.localSiteName;
        this._environmentName = siteResults.environmentName;
        this._websiteId = siteResults.websiteId;
        this._environmentId = siteResults.environmentId;
        this._isImported = isImported;
        this._exportedAt = siteResults.exportedAt;
    }

    public getChildren(): ActionsHubTreeItem[] {
        if (MetadataDiffContext.isTreeView) {
            return this.buildTreeHierarchy();
        }
        return this.buildFlatFileList();
    }

    /**
     * Build a flat list of file tree items (Git-style list view).
     * Files are sorted based on the current sort mode.
     */
    private buildFlatFileList(): ActionsHubTreeItem[] {
        // Sort results based on current sort mode
        const sortedResults = this.sortResults([...this._comparisonResults]);

        // Create flat list of file items
        return sortedResults.map(result =>
            new MetadataDiffFileTreeItem(result, this._siteName, this._isImported)
        );
    }

    /**
     * Sort comparison results based on the current sort mode
     */
    private sortResults(results: IFileComparisonResult[]): IFileComparisonResult[] {
        const sortMode = MetadataDiffContext.sortMode;

        switch (sortMode) {
            case MetadataDiffSortMode.Name:
                // Sort by file name only
                return results.sort((a, b) => {
                    const nameA = a.relativePath.split(/[/\\]/).pop() || a.relativePath;
                    const nameB = b.relativePath.split(/[/\\]/).pop() || b.relativePath;
                    return nameA.localeCompare(nameB);
                });

            case MetadataDiffSortMode.Status:
                // Sort by status (Added, Deleted, Modified), then by path
                return results.sort((a, b) => {
                    const statusOrder = {
                        [FileComparisonStatus.ADDED]: 1,
                        [FileComparisonStatus.DELETED]: 2,
                        [FileComparisonStatus.MODIFIED]: 3
                    };
                    const statusCompare = statusOrder[a.status] - statusOrder[b.status];
                    if (statusCompare !== 0) {
                        return statusCompare;
                    }
                    return a.relativePath.localeCompare(b.relativePath);
                });

            case MetadataDiffSortMode.Path:
            default:
                // Sort by full relative path (default)
                return results.sort((a, b) =>
                    a.relativePath.localeCompare(b.relativePath)
                );
        }
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
            let currentPath = "";

            // Process all parts except the last one (which is the file name)
            for (let i = 0; i < parts.length - 1; i++) {
                const folderName = parts[i];
                currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

                if (i === 0) {
                    // Look in root children
                    let folder = rootChildren.get(folderName) as MetadataDiffFolderTreeItem | undefined;
                    if (!folder) {
                        folder = new MetadataDiffFolderTreeItem(folderName, this._siteName, currentPath);
                        rootChildren.set(folderName, folder);
                    }
                    currentFolder = folder;
                } else if (currentFolder) {
                    // Look in current folder's children
                    let folder = currentFolder.childrenMap.get(folderName) as MetadataDiffFolderTreeItem | undefined;
                    if (!folder) {
                        folder = new MetadataDiffFolderTreeItem(folderName, this._siteName, currentPath);
                        currentFolder.childrenMap.set(folderName, folder);
                    }
                    currentFolder = folder;
                }
            }

            // Add the file to the appropriate folder (or root if no folders)
            const fileItem = new MetadataDiffFileTreeItem(
                result,
                this._siteName,
                this._isImported
            );

            if (currentFolder) {
                currentFolder.childrenMap.set(result.relativePath, fileItem);
            } else {
                rootChildren.set(result.relativePath, fileItem);
            }
        }

        // Separate folders and files at root level
        const folders: MetadataDiffFolderTreeItem[] = [];
        const files: MetadataDiffFileTreeItem[] = [];

        for (const child of rootChildren.values()) {
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

    public get environmentName(): string {
        return this._environmentName;
    }

    public get comparisonResults(): IFileComparisonResult[] {
        return this._comparisonResults;
    }

    public get websiteId(): string {
        return this._websiteId;
    }

    public get environmentId(): string {
        return this._environmentId;
    }

    public get isImported(): boolean {
        return this._isImported;
    }

    public get exportedAt(): string | undefined {
        return this._exportedAt;
    }

    public get localSiteName(): string {
        return this._localSiteName;
    }
}
