/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffSiteTreeItem } from "../../tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";
import MetadataDiffContext from "../../MetadataDiffContext";
import { discardSingleFile } from "./DiscardLocalChangesHandler";

/**
 * Discards all local changes for a site by reverting all files to their remote versions.
 * - For modified files: Copies remote content to local file
 * - For added files: Deletes the local file
 * - For deleted files: Copies remote file to local path
 */
export async function discardSiteChanges(siteItem: MetadataDiffSiteTreeItem): Promise<void> {
    const comparisonResults = siteItem.comparisonResults;
    const fileCount = comparisonResults.length;

    // Derive the local site folder path from the first comparison result
    const firstResult = comparisonResults[0];
    const localSitePath = firstResult.localPath.substring(0, firstResult.localPath.length - firstResult.relativePath.length - 1);

    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_DISCARD_SITE, {
        methodName: discardSiteChanges.name,
        siteName: siteItem.siteName,
        environmentName: siteItem.environmentName,
        fileCount: fileCount,
        localSitePath: localSitePath
    });

    const confirmMessage = Constants.StringFunctions.DISCARD_SITE_CHANGES_CONFIRM(siteItem.localSiteName, fileCount, localSitePath);

    const confirmButton = Constants.Strings.DISCARD_CHANGES;
    const result = await vscode.window.showWarningMessage(confirmMessage, { modal: true }, confirmButton);

    if (result !== confirmButton) {
        return;
    }

    try {
        let successCount = 0;
        const errors: string[] = [];
        const successfulPaths: Set<string> = new Set();

        for (const comparisonResult of comparisonResults) {
            try {
                discardSingleFile(comparisonResult);
                successCount++;
                successfulPaths.add(comparisonResult.relativePath);
            } catch (error) {
                errors.push(`${comparisonResult.relativePath}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Update context: if all succeeded, clear the entire site; otherwise remove only successful files
        if (errors.length === 0) {
            MetadataDiffContext.clearSiteByKey(siteItem.websiteId, siteItem.environmentId, siteItem.isImported);
        } else {
            MetadataDiffContext.removeFiles(successfulPaths, siteItem.siteName);
        }

        if (errors.length > 0) {
            const errorMessage = Constants.StringFunctions.DISCARD_LOCAL_CHANGES_FAILED(
                `${successCount}/${fileCount} files succeeded. Errors:\n${errors.join("\n")}`
            );
            await vscode.window.showErrorMessage(errorMessage);
        } else {
            const successMessage = Constants.StringFunctions.DISCARD_SITE_CHANGES_SUCCESS(siteItem.localSiteName, successCount);
            await vscode.window.showInformationMessage(successMessage);
        }
    } catch (error) {
        const errorMessage = Constants.StringFunctions.DISCARD_LOCAL_CHANGES_FAILED(error instanceof Error ? error.message : String(error));
        await vscode.window.showErrorMessage(errorMessage);
    }
}
