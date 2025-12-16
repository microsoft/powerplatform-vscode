/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "../ActionsHubTreeItem";
import { Constants } from "../../Constants";
import { FileComparisonStatus, IFileComparisonResult } from "../../models/IFileComparisonResult";
import MetadataDiffContext from "../../MetadataDiffContext";

/**
 * Custom URI scheme for metadata diff files to enable file decorations
 */
export const METADATA_DIFF_URI_SCHEME = "pp-metadata-diff";

/**
 * Tree item representing a single file in the metadata diff comparison.
 * Uses resourceUri for file-type icons and FileDecorationProvider for status badges.
 */
export class MetadataDiffFileTreeItem extends ActionsHubTreeItem {
    public readonly comparisonResult: IFileComparisonResult;
    private readonly _siteName: string;

    constructor(
        comparisonResult: IFileComparisonResult,
        siteName: string
    ) {
        // Use file name as the label
        const fileName = comparisonResult.relativePath.split(/[/\\]/).pop() || comparisonResult.relativePath;

        // Build description based on view mode
        const description = MetadataDiffFileTreeItem.buildDescription(comparisonResult);

        super(
            fileName,
            vscode.TreeItemCollapsibleState.None,
            // Pass empty ThemeIcon - it will be overridden by resourceUri
            new vscode.ThemeIcon("file"),
            Constants.ContextValues.METADATA_DIFF_FILE,
            description
        );
        this.comparisonResult = comparisonResult;
        this._siteName = siteName;

        // Use resourceUri for file-type icon detection and decoration
        // Encode the status in the URI so FileDecorationProvider can read it
        this.resourceUri = vscode.Uri.from({
            scheme: METADATA_DIFF_URI_SCHEME,
            path: comparisonResult.relativePath,
            query: `status=${comparisonResult.status}`
        });

        // Set tooltip with full local path and status
        this.tooltip = new vscode.MarkdownString(`${comparisonResult.localPath} • ${MetadataDiffFileTreeItem.getStatusDescription(comparisonResult.status)}`);

        // Set command to open diff when clicked
        this.command = {
            command: Constants.Commands.METADATA_DIFF_OPEN_FILE,
            title: Constants.Strings.SHOW_DIFF,
            arguments: [this]
        };
    }

    /**
     * Build the description string based on view mode.
     * In list view: shows folder path
     * In tree view: empty (folder structure provides context)
     */
    private static buildDescription(comparisonResult: IFileComparisonResult): string {
        if (MetadataDiffContext.isTreeView) {
            return "";
        }

        const pathParts = comparisonResult.relativePath.split(/[/\\]/);
        if (pathParts.length > 1) {
            // Show parent folder path in list view
            return pathParts.slice(0, -1).join("/");
        }
        return "";
    }

    /**
     * Get full status description for tooltip
     */
    private static getStatusDescription(status: IFileComparisonResult["status"]): string {
        switch (status) {
            case FileComparisonStatus.MODIFIED:
                return Constants.Strings.METADATA_DIFF_MODIFIED;
            case FileComparisonStatus.ADDED:
                return Constants.Strings.METADATA_DIFF_ADDED;
            case FileComparisonStatus.DELETED:
                return Constants.Strings.METADATA_DIFF_DELETED;
            default:
                return "";
        }
    }

    public get siteName(): string {
        return this._siteName;
    }
}
