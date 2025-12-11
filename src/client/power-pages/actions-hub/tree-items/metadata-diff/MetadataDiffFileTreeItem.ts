/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "../ActionsHubTreeItem";
import { Constants } from "../../Constants";
import { IFileComparisonResult } from "../../models/IFileComparisonResult";

/**
 * Tree item representing a single file in the metadata diff comparison
 */
export class MetadataDiffFileTreeItem extends ActionsHubTreeItem {
    public readonly comparisonResult: IFileComparisonResult;
    private readonly _siteName: string;

    constructor(
        fileName: string,
        comparisonResult: IFileComparisonResult,
        siteName: string
    ) {
        super(
            fileName,
            vscode.TreeItemCollapsibleState.None,
            MetadataDiffFileTreeItem.getIcon(comparisonResult.status),
            Constants.ContextValues.METADATA_DIFF_FILE,
            MetadataDiffFileTreeItem.getDescription(comparisonResult.status)
        );
        this.comparisonResult = comparisonResult;
        this._siteName = siteName;

        // Set command to open diff when clicked
        this.command = {
            command: Constants.Commands.METADATA_DIFF_OPEN_FILE,
            title: vscode.l10n.t("Show Diff"),
            arguments: [this]
        };
    }

    private static getIcon(status: IFileComparisonResult["status"]): vscode.ThemeIcon {
        switch (status) {
            case "modified":
                return Constants.Icons.METADATA_DIFF_MODIFIED;
            case "added":
                return Constants.Icons.METADATA_DIFF_ADDED;
            case "deleted":
                return Constants.Icons.METADATA_DIFF_DELETED;
            default:
                return new vscode.ThemeIcon("file");
        }
    }

    private static getDescription(status: IFileComparisonResult["status"]): string {
        switch (status) {
            case "modified":
                return Constants.Strings.METADATA_DIFF_MODIFIED;
            case "added":
                return Constants.Strings.METADATA_DIFF_ADDED;
            case "deleted":
                return Constants.Strings.METADATA_DIFF_DELETED;
            default:
                return "";
        }
    }

    public get siteName(): string {
        return this._siteName;
    }
}
