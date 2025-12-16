/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import { MetadataDiffSiteTreeItem } from "../../tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { Constants } from "../../Constants";
import { traceError, traceInfo } from "../../TelemetryHelper";
import { IMetadataDiffExport, IExportableFileComparisonResult, METADATA_DIFF_EXPORT_VERSION } from "../../models/IMetadataDiffExport";
import { isBinaryFile } from "../../ActionsHubUtils";
import { getExtensionVersion } from "../../../../../common/utilities/Utils";
import { FileComparisonStatus } from "../../models/IFileComparisonResult";

/**
 * Exports metadata diff results to a JSON file
 * @param siteTreeItem The site tree item containing the comparison results
 */
export async function exportMetadataDiff(siteTreeItem: MetadataDiffSiteTreeItem): Promise<void> {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_EXPORT, {
        methodName: exportMetadataDiff.name,
        websiteId: siteTreeItem.websiteId,
        fileCount: siteTreeItem.comparisonResults.length.toString()
    });

    try {
        // Generate filename with site name and date
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const safeSiteName = siteTreeItem.siteName.replace(/[^a-zA-Z0-9-_]/g, "_");
        const defaultFilename = `${safeSiteName}-diff-${dateStr}.json`;

        // Show save dialog first (before progress)
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultFilename),
            filters: {
                [Constants.Strings.METADATA_DIFF_EXPORT_FILTER_NAME]: ["json"]
            },
            title: vscode.l10n.t("Export Metadata Diff")
        });

        if (!saveUri) {
            return; // User cancelled
        }

        // Now show progress while doing the actual work
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: Constants.Strings.METADATA_DIFF_EXPORT_PROGRESS,
                cancellable: false
            },
            async () => {
                // Build the export data
                const files: IExportableFileComparisonResult[] = [];

                for (const result of siteTreeItem.comparisonResults) {
                    // Use includeSvg=false since SVG is text-based and can be exported
                    const isBinary = isBinaryFile(result.relativePath, false);

                    let localContent: string | null = null;
                    let remoteContent: string | null = null;

                    // Only include content for non-binary files
                    if (!isBinary) {
                        // Read local content for added and modified files
                        if (result.status !== FileComparisonStatus.DELETED && fs.existsSync(result.localPath)) {
                            try {
                                const content = fs.readFileSync(result.localPath);
                                localContent = content.toString("base64");
                            } catch (e) {
                                // File not readable, content will be null
                            }
                        }

                        // Read remote content for deleted and modified files
                        if (result.status !== FileComparisonStatus.ADDED && fs.existsSync(result.remotePath)) {
                            try {
                                const content = fs.readFileSync(result.remotePath);
                                remoteContent = content.toString("base64");
                            } catch (e) {
                                // File not readable, content will be null
                            }
                        }
                    }

                    files.push({
                        relativePath: result.relativePath,
                        status: result.status,
                        localContent,
                        remoteContent
                    });
                }

                const exportData: IMetadataDiffExport = {
                    version: METADATA_DIFF_EXPORT_VERSION,
                    extensionVersion: getExtensionVersion(),
                    exportedAt: new Date().toISOString(),
                    websiteId: siteTreeItem.websiteId,
                    websiteName: siteTreeItem.siteName,
                    environmentId: siteTreeItem.environmentId,
                    environmentName: siteTreeItem.environmentName,
                    localSiteName: siteTreeItem.localSiteName,
                    files
                };

                // Write the file
                const jsonContent = JSON.stringify(exportData, null, 2);
                fs.writeFileSync(saveUri.fsPath, jsonContent, "utf8");

                traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_EXPORT_SUCCESS, {
                    methodName: exportMetadataDiff.name,
                    websiteId: siteTreeItem.websiteId,
                    fileCount: files.length.toString(),
                    exportPath: saveUri.fsPath
                });
            }
        );

        // Show success message after progress completes
        vscode.window.showInformationMessage(
            Constants.StringFunctions.METADATA_DIFF_EXPORT_SUCCESS(saveUri.fsPath)
        );
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_EXPORT_FAILED,
            error as Error,
            {
                methodName: exportMetadataDiff.name,
                websiteId: siteTreeItem.websiteId
            }
        );
        vscode.window.showErrorMessage(
            vscode.l10n.t("Failed to export comparison: {0}", (error as Error).message)
        );
    }
}
