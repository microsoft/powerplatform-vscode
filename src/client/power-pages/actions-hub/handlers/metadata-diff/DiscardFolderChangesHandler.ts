/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffFolderTreeItem } from "../../tree-items/metadata-diff/MetadataDiffFolderTreeItem";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";
import MetadataDiffContext from "../../MetadataDiffContext";
import { discardSingleFile } from "./DiscardLocalChangesHandler";

/**
 * Discards local changes for all files in a folder by reverting to the remote versions.
 * - For modified files: Copies remote content to local file
 * - For added files: Deletes the local file
 * - For deleted files: Copies remote file to local path
 */
export async function discardFolderChanges(folderItem: MetadataDiffFolderTreeItem): Promise<void> {
    const fileItems = folderItem.getAllFileItems();
    const fileCount = fileItems.length;

    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_DISCARD_FOLDER, {
        methodName: discardFolderChanges.name,
        folderPath: folderItem.folderPath,
        siteName: folderItem.siteName,
        fileCount: fileCount
    });

    const confirmMessage = Constants.StringFunctions.DISCARD_FOLDER_CHANGES_CONFIRM(folderItem.folderPath, fileCount);

    const confirmButton = Constants.Strings.DISCARD_CHANGES;
    const result = await vscode.window.showWarningMessage(confirmMessage, { modal: true }, confirmButton);

    if (result !== confirmButton) {
        return;
    }

    try {
        let successCount = 0;
        const errors: string[] = [];

        for (const fileItem of fileItems) {
            try {
                discardSingleFile(fileItem.comparisonResult);
                successCount++;
            } catch (error) {
                errors.push(`${fileItem.comparisonResult.relativePath}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Remove all successfully discarded files from the comparison results
        for (const fileItem of fileItems) {
            // Only remove if not in errors list
            const hasError = errors.some(e => e.startsWith(fileItem.comparisonResult.relativePath + ":"));
            if (!hasError) {
                MetadataDiffContext.removeFile(fileItem.comparisonResult.relativePath, fileItem.siteName);
            }
        }

        if (errors.length > 0) {
            const errorMessage = Constants.StringFunctions.DISCARD_LOCAL_CHANGES_FAILED(
                `${successCount}/${fileCount} files succeeded. Errors:\n${errors.join("\n")}`
            );
            await vscode.window.showErrorMessage(errorMessage);
        } else {
            const successMessage = Constants.StringFunctions.DISCARD_FOLDER_CHANGES_SUCCESS(folderItem.folderPath, successCount);
            await vscode.window.showInformationMessage(successMessage);
        }
    } catch (error) {
        const errorMessage = Constants.StringFunctions.DISCARD_LOCAL_CHANGES_FAILED(error instanceof Error ? error.message : String(error));
        await vscode.window.showErrorMessage(errorMessage);
    }
}
