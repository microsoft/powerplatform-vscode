/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import { MetadataDiffFileTreeItem } from "../../tree-items/metadata-diff/MetadataDiffFileTreeItem";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";

/**
 * Opens a single file diff in the VS Code diff editor
 */
export async function openMetadataDiffFile(fileItem: MetadataDiffFileTreeItem): Promise<void> {
    const { comparisonResult, siteName } = fileItem;

    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_OPEN_FILE, {
        methodName: openMetadataDiffFile.name,
        relativePath: comparisonResult.relativePath,
        status: comparisonResult.status
    });

    const title = vscode.l10n.t("{0}: {1} (Remote ↔ Local)", siteName, comparisonResult.relativePath);

    // Handle different diff scenarios based on file status
    if (comparisonResult.status === "deleted") {
        // File exists in remote but not locally - show remote on left, empty on right
        const remoteUri = vscode.Uri.file(comparisonResult.remotePath);

        if (fs.existsSync(comparisonResult.remotePath)) {
            // Show the remote file only (since local doesn't exist)
            await vscode.commands.executeCommand("vscode.diff", remoteUri, vscode.Uri.parse("untitled:"), title);
        }
    } else if (comparisonResult.status === "added") {
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
