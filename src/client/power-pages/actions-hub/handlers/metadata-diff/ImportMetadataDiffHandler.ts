/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { Constants } from "../../Constants";
import { traceError, traceInfo } from "../../TelemetryHelper";
import { IMetadataDiffExport, METADATA_DIFF_EXPORT_VERSION } from "../../models/IMetadataDiffExport";
import { FileComparisonStatus, IFileComparisonResult } from "../../models/IFileComparisonResult";
import MetadataDiffContext from "../../MetadataDiffContext";
import { getExtensionVersion } from "../../../../../common/utilities/Utils";

/**
 * Compares two semantic version strings
 * @param v1 First version string (e.g., "1.2.3")
 * @param v2 Second version string (e.g., "1.2.4")
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(".").map(p => parseInt(p, 10) || 0);
    const parts2 = v2.split(".").map(p => parseInt(p, 10) || 0);

    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 < num2) return -1;
        if (num1 > num2) return 1;
    }

    return 0;
}

/**
 * Validates the import data structure
 * @param data The parsed JSON data
 * @returns Error message if invalid, undefined if valid
 */
function validateImportData(data: unknown): string | undefined {
    if (!data || typeof data !== "object") {
        return Constants.Strings.METADATA_DIFF_EXPORT_INVALID_FILE;
    }

    const importData = data as Partial<IMetadataDiffExport>;

    // Check version (strict equality)
    if (importData.version !== METADATA_DIFF_EXPORT_VERSION) {
        return Constants.Strings.METADATA_DIFF_EXPORT_UNSUPPORTED_VERSION;
    }

    // Check required fields
    const requiredFields: (keyof IMetadataDiffExport)[] = [
        "version",
        "extensionVersion",
        "exportedAt",
        "websiteId",
        "websiteName",
        "environmentId",
        "environmentName",
        "localSiteName",
        "files"
    ];

    for (const field of requiredFields) {
        if (importData[field] === undefined || importData[field] === null) {
            return Constants.StringFunctions.METADATA_DIFF_MISSING_REQUIRED_FIELD(field);
        }
    }

    // Check that extension version is not newer than current
    const currentVersion = getExtensionVersion();
    if (importData.extensionVersion && currentVersion) {
        if (compareVersions(importData.extensionVersion, currentVersion) > 0) {
            return Constants.Strings.METADATA_DIFF_EXPORT_NEWER_EXTENSION_VERSION;
        }
    }

    // Validate files array
    if (!Array.isArray(importData.files)) {
        return Constants.StringFunctions.METADATA_DIFF_MISSING_REQUIRED_FIELD("files");
    }

    // Validate each file entry
    for (const file of importData.files) {
        if (!file.relativePath || typeof file.relativePath !== "string") {
            return Constants.StringFunctions.METADATA_DIFF_MISSING_REQUIRED_FIELD("files[].relativePath");
        }
        if (!file.status || !Object.values(FileComparisonStatus).includes(file.status)) {
            return Constants.StringFunctions.METADATA_DIFF_MISSING_REQUIRED_FIELD("files[].status");
        }
    }

    return undefined;
}

/**
 * Imports a metadata diff from a JSON file
 */
export async function importMetadataDiff(): Promise<void> {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_IMPORT_CALLED, {
        methodName: importMetadataDiff.name
    });

    try {
        // Show open dialog first (before progress)
        const openUris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: {
                [Constants.Strings.METADATA_DIFF_EXPORT_FILTER_NAME]: ["json"]
            },
            title: vscode.l10n.t("Import Metadata Diff")
        });

        if (!openUris || openUris.length === 0) {
            return; // User cancelled
        }

        const fileUri = openUris[0];

        // Read and parse the file first to validate before showing progress
        let importData: IMetadataDiffExport;

        try {
            const fileContent = fs.readFileSync(fileUri.fsPath, "utf8");
            const parsed = JSON.parse(fileContent);

            // Validate the data
            const validationError = validateImportData(parsed);
            if (validationError) {
                vscode.window.showErrorMessage(validationError);
                traceError(
                    Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_IMPORT_FAILED,
                    new Error(validationError),
                    { methodName: importMetadataDiff.name, reason: "validation_failed" }
                );
                return;
            }

            importData = parsed as IMetadataDiffExport;
        } catch (parseError) {
            vscode.window.showErrorMessage(Constants.Strings.METADATA_DIFF_EXPORT_INVALID_FILE);
            traceError(
                Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_IMPORT_FAILED,
                parseError as Error,
                { methodName: importMetadataDiff.name, reason: "parse_failed" }
            );
            return;
        }

        // Check if there's already an imported comparison for this site
        if (MetadataDiffContext.hasImportedComparison(importData.websiteId, importData.environmentId)) {
            const confirmation = await vscode.window.showWarningMessage(
                Constants.Strings.METADATA_DIFF_REPLACE_EXISTING_IMPORT,
                { modal: true },
                Constants.Strings.REPLACE
            );

            if (confirmation !== Constants.Strings.REPLACE) {
                return;
            }
        }

        // Get the storage path for imported diffs
        const extensionContext = MetadataDiffContext.extensionContext;
        if (!extensionContext?.globalStorageUri) {
            traceError(
                Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_IMPORT_FAILED,
                new Error("Global storage URI not available"),
                { methodName: importMetadataDiff.name, reason: "no_storage" }
            );
            return;
        }

        // Now show progress while doing the actual file writing work
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: Constants.Strings.METADATA_DIFF_IMPORT_PROGRESS,
                cancellable: false
            },
            async () => {
                const importedDiffsPath = path.join(
                    extensionContext.globalStorageUri.fsPath,
                    "imported-diffs",
                    `${importData.websiteId}_${importData.environmentId}`
                );

                // Create the directory if it doesn't exist
                if (!fs.existsSync(importedDiffsPath)) {
                    fs.mkdirSync(importedDiffsPath, { recursive: true });
                }

                // Write the file contents to the storage
                const comparisonResults: IFileComparisonResult[] = [];

                for (const file of importData.files) {
                    const localPath = path.join(importedDiffsPath, "local", file.relativePath);
                    const remotePath = path.join(importedDiffsPath, "remote", file.relativePath);

                    // Ensure directories exist
                    const localDir = path.dirname(localPath);
                    const remoteDir = path.dirname(remotePath);

                    if (!fs.existsSync(localDir)) {
                        fs.mkdirSync(localDir, { recursive: true });
                    }
                    if (!fs.existsSync(remoteDir)) {
                        fs.mkdirSync(remoteDir, { recursive: true });
                    }

                    // Write local content if available
                    if (file.localContent) {
                        const content = Buffer.from(file.localContent, "base64");
                        fs.writeFileSync(localPath, content);
                    }

                    // Write remote content if available
                    if (file.remoteContent) {
                        const content = Buffer.from(file.remoteContent, "base64");
                        fs.writeFileSync(remotePath, content);
                    }

                    comparisonResults.push({
                        relativePath: file.relativePath,
                        status: file.status,
                        localPath,
                        remotePath
                    });
                }

                // Store the results in the context
                MetadataDiffContext.setResults(
                    comparisonResults,
                    importData.websiteName,
                    importData.localSiteName,
                    importData.environmentName,
                    importData.websiteId,
                    importData.environmentId,
                    true, // isImported
                    importData.exportedAt
                );

                traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_IMPORT_SUCCESS, {
                    methodName: importMetadataDiff.name,
                    websiteId: importData.websiteId,
                    fileCount: comparisonResults.length.toString()
                });
            }
        );

        // Show success message after progress completes
        vscode.window.showInformationMessage(
            Constants.StringFunctions.METADATA_DIFF_IMPORT_SUCCESS(importData.websiteName)
        );
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_IMPORT_FAILED,
            error as Error,
            { methodName: importMetadataDiff.name }
        );
        vscode.window.showErrorMessage(
            Constants.StringFunctions.METADATA_DIFF_IMPORT_FAILED((error as Error).message)
        );
    }
}
