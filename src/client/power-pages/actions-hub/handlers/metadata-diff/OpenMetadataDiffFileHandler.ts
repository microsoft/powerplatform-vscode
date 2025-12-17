/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import { MetadataDiffFileTreeItem } from "../../tree-items/metadata-diff/MetadataDiffFileTreeItem";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";
import { FileComparisonStatus } from "../../models/IFileComparisonResult";
import { isBinaryFile } from "../../ActionsHubUtils";

/**
 * Opens a single file diff in the VS Code diff editor
 */
export async function openMetadataDiffFile(fileItem: MetadataDiffFileTreeItem): Promise<void> {
    const { comparisonResult, siteName, isImported } = fileItem;

    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_OPEN_FILE, {
        methodName: openMetadataDiffFile.name,
        relativePath: comparisonResult.relativePath,
        status: comparisonResult.status,
        isImported: isImported
    });

    const title = Constants.StringFunctions.COMPARE_FILE_TITLE(siteName, comparisonResult.relativePath);

    // Handle binary files - open them directly instead of trying to diff
    if (isBinaryFile(comparisonResult.relativePath)) {
        // For imported comparisons, binary content is not available
        if (isImported) {
            vscode.window.showInformationMessage(Constants.Strings.METADATA_DIFF_BINARY_FILE_NOT_AVAILABLE);
            return;
        }

        await openBinaryFile(comparisonResult.localPath, comparisonResult.remotePath, comparisonResult.status);
        return;
    }

    // Handle different diff scenarios based on file status
    if (comparisonResult.status === FileComparisonStatus.DELETED) {
        // File exists in remote but not locally - show remote on left, empty on right
        const remoteUri = vscode.Uri.file(comparisonResult.remotePath);

        if (fs.existsSync(comparisonResult.remotePath)) {
            // Show the remote file only (since local doesn't exist)
            await vscode.commands.executeCommand("vscode.diff", remoteUri, vscode.Uri.parse("untitled:"), title);
        }
    } else if (comparisonResult.status === FileComparisonStatus.ADDED) {
        // File exists locally but not in remote - show empty on left, local on right
        const localUri = vscode.Uri.file(comparisonResult.localPath);

        if (fs.existsSync(comparisonResult.localPath)) {
            await vscode.commands.executeCommand("vscode.diff", vscode.Uri.parse("untitled:"), localUri, title);
        }
    } else {
        // Modified - both exist, show standard diff
        const remoteUri = vscode.Uri.file(comparisonResult.remotePath);
        const localUri = vscode.Uri.file(comparisonResult.localPath);

        if (fs.existsSync(comparisonResult.remotePath) && fs.existsSync(comparisonResult.localPath)) {
            await vscode.commands.executeCommand("vscode.diff", remoteUri, localUri, title);
        }
    }
}

/**
 * Opens binary files directly since they can't be diffed in text format.
 * For modified files, opens both remote and local versions side by side for visual comparison.
 * For added files, opens the local version.
 * For deleted files, opens the remote version.
 */
async function openBinaryFile(localPath: string, remotePath: string, status: string): Promise<void> {
    if (status === FileComparisonStatus.DELETED) {
        // For deleted files, the file only exists in remote
        if (fs.existsSync(remotePath)) {
            await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(remotePath));
        }
    } else if (status === FileComparisonStatus.ADDED) {
        // For added files, open the local version
        if (fs.existsSync(localPath)) {
            await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(localPath));
        }
    } else {
        // For modified files, open both remote and local side by side for visual comparison
        if (fs.existsSync(remotePath) && fs.existsSync(localPath)) {
            // Open remote file in the first editor group (left side)
            await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(remotePath), vscode.ViewColumn.One);
            // Open local file in the second editor group (right side)
            await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(localPath), vscode.ViewColumn.Two);
        } else if (fs.existsSync(localPath)) {
            // Fallback: if only local exists, just open it
            await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(localPath));
        } else if (fs.existsSync(remotePath)) {
            // Fallback: if only remote exists, just open it
            await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(remotePath));
        }
    }
}
