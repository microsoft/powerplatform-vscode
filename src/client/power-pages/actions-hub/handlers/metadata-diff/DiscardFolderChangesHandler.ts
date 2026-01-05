/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as path from "path";
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

    // Get the full local path for the folder from the first file's local path
    let fullLocalPath = folderItem.folderPath;
    if (fileItems.length > 0) {
        const firstFile = fileItems[0].comparisonResult;
        // Normalize the relative path to use OS-specific separators for string replacement
        const normalizedRelativePath = firstFile.relativePath.replace(/[/\\]/g, path.sep);
        // Remove the relative path portion from the local path to get the base, then append folder path
        const basePath = firstFile.localPath.replace(normalizedRelativePath, "");
        // Normalize the folder path to use OS-specific separators
        const normalizedFolderPath = folderItem.folderPath.replace(/[/\\]/g, path.sep);
        fullLocalPath = basePath + normalizedFolderPath;
    }

    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_DISCARD_FOLDER, {
        methodName: discardFolderChanges.name,
        folderPath: folderItem.folderPath,
        siteName: folderItem.siteName,
        fileCount: fileCount
    });

    const confirmMessage = Constants.StringFunctions.DISCARD_FOLDER_CHANGES_CONFIRM(fullLocalPath, fileCount);

    const confirmButton = Constants.Strings.DISCARD_CHANGES;
    const result = await vscode.window.showWarningMessage(confirmMessage, { modal: true }, confirmButton);

    if (result !== confirmButton) {
        return;
    }

    try {
        let successCount = 0;
        const errors: string[] = [];
        const successfulPaths: Set<string> = new Set();

        for (const fileItem of fileItems) {
            try {
                discardSingleFile(fileItem.comparisonResult);
                successCount++;
                successfulPaths.add(fileItem.comparisonResult.relativePath);
            } catch (error) {
                errors.push(`${fileItem.comparisonResult.relativePath}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Remove all successfully discarded files from the comparison results in a single batch
        if (successfulPaths.size > 0) {
            MetadataDiffContext.removeFiles(successfulPaths, folderItem.siteName);
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
