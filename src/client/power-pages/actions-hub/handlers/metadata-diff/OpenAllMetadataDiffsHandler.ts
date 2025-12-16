/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffSiteTreeItem } from "../../tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";
import { FileComparisonStatus, IFileComparisonResult } from "../../models/IFileComparisonResult";

/**
 * Common binary file extensions that cannot be diffed in the text diff viewer
 */
const BINARY_FILE_EXTENSIONS = new Set([
    // Images
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".bmp", ".tiff", ".tif", ".svg",
    // Fonts
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    // Media
    ".mp4", ".mp3", ".wav", ".ogg", ".webm", ".avi", ".mov",
    // Documents
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    // Archives
    ".zip", ".rar", ".7z", ".tar", ".gz",
    // Other binary
    ".exe", ".dll", ".so", ".dylib"
]);

/**
 * Checks if a file is a binary file based on its extension
 * @param relativePath The relative path of the file
 * @returns True if the file is binary, false otherwise
 */
export function isBinaryFile(relativePath: string): boolean {
    const lowerPath = relativePath.toLowerCase();
    const extension = lowerPath.substring(lowerPath.lastIndexOf("."));
    return BINARY_FILE_EXTENSIONS.has(extension);
}

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

    // Separate text and binary files
    const textFiles: IFileComparisonResult[] = [];
    const binaryFiles: IFileComparisonResult[] = [];

    for (const result of comparisonResults) {
        if (isBinaryFile(result.relativePath)) {
            binaryFiles.push(result);
        } else {
            textFiles.push(result);
        }
    }

    // Log binary file count for telemetry
    if (binaryFiles.length > 0) {
        traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_OPEN_ALL, {
            methodName: openAllMetadataDiffs.name,
            binaryFilesSkipped: binaryFiles.length.toString(),
            textFilesIncluded: textFiles.length.toString()
        });
    }

    // Show the multi-diff editor only for text files
    if (textFiles.length > 0) {
        // Create resource list for the changes editor
        const resourceList: [vscode.Uri, vscode.Uri | undefined, vscode.Uri | undefined][] = textFiles.map(result => {
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

        const title = Constants.StringFunctions.COMPARE_ALL_TITLE(siteName);
        await vscode.commands.executeCommand("vscode.changes", title, resourceList);
    }

    // Show info message about binary files if any were skipped
    if (binaryFiles.length > 0) {
        const message = textFiles.length === 0
            ? Constants.Strings.METADATA_DIFF_ONLY_BINARY_FILES
            : Constants.StringFunctions.METADATA_DIFF_BINARY_FILES_SKIPPED(binaryFiles.length);
        await vscode.window.showInformationMessage(message);
    }
}
