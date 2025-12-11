/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffSiteTreeItem } from "../../tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";
import { FileComparisonStatus } from "../../models/IFileComparisonResult";

/**
 * Opens all file diffs in the multi-diff editor for a specific site
 */
export async function openAllMetadataDiffs(siteItem: MetadataDiffSiteTreeItem): Promise<void> {
    const { comparisonResults, siteName } = siteItem;

    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_OPEN_ALL, {
        methodName: openAllMetadataDiffs.name,
        totalFiles: comparisonResults.length.toString()
    });

    if (comparisonResults.length === 0) {
        return;
    }

    // Create resource list for the changes editor
    const resourceList: [vscode.Uri, vscode.Uri | undefined, vscode.Uri | undefined][] = comparisonResults.map(result => {
        const labelUri = vscode.Uri.parse(`diff-label:${result.relativePath}`);
        const originalUri = vscode.Uri.file(result.remotePath);
        const modifiedUri = vscode.Uri.file(result.localPath);

        if (result.status === FileComparisonStatus.DELETED) {
            return [labelUri, originalUri, undefined];
        } else if (result.status === FileComparisonStatus.ADDED) {
            return [labelUri, undefined, modifiedUri];
        } else {
            return [labelUri, originalUri, modifiedUri];
        }
    });

    const title = vscode.l10n.t("Compare: {0} (Remote ↔ Local)", siteName);
    await vscode.commands.executeCommand("vscode.changes", title, resourceList);
}
