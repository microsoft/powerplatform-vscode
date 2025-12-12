/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { MetadataDiffFileTreeItem } from "../../tree-items/metadata-diff/MetadataDiffFileTreeItem";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";
import { FileComparisonStatus, IFileComparisonResult } from "../../models/IFileComparisonResult";
import MetadataDiffContext from "../../MetadataDiffContext";

/**
 * Discards changes for a single file without showing any UI prompts.
 * This is the core logic shared between single file and folder discard operations.
 */
export function discardSingleFile(comparisonResult: IFileComparisonResult): void {
    switch (comparisonResult.status) {
        case FileComparisonStatus.MODIFIED:
            // Copy remote content to local file
            if (fs.existsSync(comparisonResult.remotePath)) {
                const remoteContent = fs.readFileSync(comparisonResult.remotePath);
                fs.writeFileSync(comparisonResult.localPath, remoteContent);
            }
            break;

        case FileComparisonStatus.ADDED:
            // Delete the local file (it doesn't exist in remote)
            if (fs.existsSync(comparisonResult.localPath)) {
                fs.unlinkSync(comparisonResult.localPath);
            }
            break;

        case FileComparisonStatus.DELETED:
            // Copy remote file to local path
            if (fs.existsSync(comparisonResult.remotePath)) {
                // Ensure directory exists
                const parentDir = path.dirname(comparisonResult.localPath);
                if (!fs.existsSync(parentDir)) {
                    fs.mkdirSync(parentDir, { recursive: true });
                }
                const remoteContent = fs.readFileSync(comparisonResult.remotePath);
                fs.writeFileSync(comparisonResult.localPath, remoteContent);
            }
            break;
    }
}

/**
 * Discards local changes for a single file by reverting to the remote version.
 * - For modified files: Copies remote content to local file
 * - For added files: Deletes the local file
 * - For deleted files: Copies remote file to local path
 */
export async function discardLocalChanges(fileItem: MetadataDiffFileTreeItem): Promise<void> {
    const { comparisonResult, siteName } = fileItem;

    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_DISCARD_FILE, {
        methodName: discardLocalChanges.name,
        relativePath: comparisonResult.relativePath,
        status: comparisonResult.status
    });

    const confirmMessage = Constants.StringFunctions.DISCARD_LOCAL_CHANGES_CONFIRM(comparisonResult.relativePath);

    const confirmButton = Constants.Strings.DISCARD_CHANGES;
    const result = await vscode.window.showWarningMessage(confirmMessage, { modal: true }, confirmButton);

    if (result !== confirmButton) {
        return;
    }

    try {
        discardSingleFile(comparisonResult);

        // Remove this file from the comparison results
        MetadataDiffContext.removeFile(comparisonResult.relativePath, siteName);

        const successMessage = Constants.StringFunctions.DISCARD_LOCAL_CHANGES_SUCCESS(comparisonResult.relativePath);
        await vscode.window.showInformationMessage(successMessage);
    } catch (error) {
        const errorMessage = Constants.StringFunctions.DISCARD_LOCAL_CHANGES_FAILED(error instanceof Error ? error.message : String(error));
        await vscode.window.showErrorMessage(errorMessage);
    }
}
