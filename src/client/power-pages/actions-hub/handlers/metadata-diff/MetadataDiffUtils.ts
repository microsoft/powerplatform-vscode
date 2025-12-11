/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { Constants } from "../../Constants";
import { traceInfo } from "../../TelemetryHelper";
import { findPowerPagesSiteFolder, findWebsiteYmlFolder, getWebsiteRecordId } from "../../../../../common/utilities/WorkspaceInfoFinderUtil";
import { POWERPAGES_SITE_FOLDER } from "../../../../../common/constants";
import { showProgressWithNotification } from "../../../../../common/utilities/Utils";
import { FileComparisonStatus, IFileComparisonResult } from "../../models/IFileComparisonResult";
import { getAllFiles } from "../../ActionsHubUtils";
import MetadataDiffContext from "../../MetadataDiffContext";

/**
 * Result of resolving site information from workspace
 */
export interface SiteResolutionResult {
    siteId: string;
    localSitePath: string;
}

/**
 * Compares files between downloaded site and local workspace
 * @param downloadedSitePath Path to the downloaded site
 * @param localSitePath Path to the local site
 * @returns Array of file comparison results
 */
export function compareFiles(downloadedSitePath: string, localSitePath: string): IFileComparisonResult[] {
    const results: IFileComparisonResult[] = [];

    const downloadedFiles = getAllFiles(downloadedSitePath);
    const localFiles = getAllFiles(localSitePath);

    // Check for modified and deleted files (files in remote but may differ locally or not exist)
    for (const [relativePath, remotePath] of downloadedFiles) {
        const localPath = localFiles.get(relativePath);

        if (localPath) {
            // File exists in both - check if content differs
            const remoteContent = fs.readFileSync(remotePath);
            const localContent = fs.readFileSync(localPath);

            if (!remoteContent.equals(localContent)) {
                results.push({
                    localPath,
                    remotePath,
                    relativePath,
                    status: FileComparisonStatus.MODIFIED
                });
            }
        } else {
            // File exists in remote but not locally - deleted locally
            results.push({
                localPath: path.join(localSitePath, relativePath),
                remotePath,
                relativePath,
                status: FileComparisonStatus.DELETED
            });
        }
    }

    // Check for added files (files in local but not in remote)
    for (const [relativePath, localPath] of localFiles) {
        if (!downloadedFiles.has(relativePath)) {
            results.push({
                localPath,
                remotePath: path.join(downloadedSitePath, relativePath),
                relativePath,
                status: FileComparisonStatus.ADDED
            });
        }
    }

    return results;
}

/**
 * Resolves the site ID and local site path from the workspace
 * @param workingDirectory The workspace root directory
 * @param resource Optional resource URI (e.g., from context menu)
 * @returns Site resolution result or undefined if site ID not found
 */
export function resolveSiteFromWorkspace(workingDirectory: string, resource?: vscode.Uri): SiteResolutionResult | undefined {
    let siteId: string | undefined;
    let localSitePath = workingDirectory;

    // Strategy 1: Check if website.yml exists directly in working directory
    siteId = getWebsiteRecordId(workingDirectory);

    // Strategy 2: If resource is provided, traverse up from resource to find website.yml
    if (!siteId && resource?.fsPath) {
        const websiteYmlFolder = findWebsiteYmlFolder(resource.fsPath);
        if (websiteYmlFolder) {
            siteId = getWebsiteRecordId(websiteYmlFolder);
            localSitePath = websiteYmlFolder;
        }
    }

    // Strategy 3: Look for a 'site' folder in working directory
    if (!siteId) {
        const powerPagesSiteFolder = findPowerPagesSiteFolder(workingDirectory);

        if (powerPagesSiteFolder) {
            const siteFolderPath = path.join(powerPagesSiteFolder, POWERPAGES_SITE_FOLDER);
            siteId = getWebsiteRecordId(siteFolderPath);
            if (siteId) {
                localSitePath = siteFolderPath;
            }
        }
    }

    if (!siteId) {
        return undefined;
    }

    return { siteId, localSitePath };
}

/**
 * Prepares the storage path for downloading sites for comparison
 * @param storagePath The extension storage path
 * @returns The prepared site storage path
 */
export function prepareSiteStoragePath(storagePath: string): string {
    const siteStoragePath = path.join(storagePath, "sites-for-comparison");

    if (fs.existsSync(siteStoragePath)) {
        fs.rmSync(siteStoragePath, { recursive: true, force: true });
    }

    fs.mkdirSync(siteStoragePath, { recursive: true });

    return siteStoragePath;
}

/**
 * Processes comparison results and updates the MetadataDiffContext
 * @param siteStoragePath Path where site was downloaded
 * @param localSitePath Path to local site
 * @param siteName Name of the site being compared
 * @param environmentName Name of the environment
 * @param methodName Name of the calling method for telemetry
 * @param siteId Site ID for telemetry
 * @param completedEventName Telemetry event name for completion
 * @param noDifferencesEventName Telemetry event name for no differences
 */
export async function processComparisonResults(
    siteStoragePath: string,
    localSitePath: string,
    siteName: string,
    environmentName: string,
    methodName: string,
    siteId: string,
    completedEventName: string,
    noDifferencesEventName: string
): Promise<void> {
    await showProgressWithNotification(
        Constants.Strings.COMPARING_FILES,
        async () => {
            // Find the actual downloaded site folder (name is not deterministic)
            const downloadedFolders = fs.readdirSync(siteStoragePath, { withFileTypes: true })
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);

            const siteDownloadPath = path.join(siteStoragePath, downloadedFolders[0]);
            const comparisonResults = compareFiles(siteDownloadPath, localSitePath);

            if (comparisonResults.length === 0) {
                traceInfo(noDifferencesEventName, {
                    methodName,
                    siteId
                });
                await vscode.window.showInformationMessage(Constants.Strings.NO_DIFFERENCES_FOUND);
                MetadataDiffContext.clear();
            } else {
                traceInfo(completedEventName, {
                    methodName,
                    siteId,
                    totalDifferences: comparisonResults.length.toString(),
                    modifiedFiles: comparisonResults.filter(r => r.status === FileComparisonStatus.MODIFIED).length.toString(),
                    addedFiles: comparisonResults.filter(r => r.status === FileComparisonStatus.ADDED).length.toString(),
                    deletedFiles: comparisonResults.filter(r => r.status === FileComparisonStatus.DELETED).length.toString()
                });

                // Store results in the context so the tree view can display them
                MetadataDiffContext.setResults(comparisonResults, siteName, environmentName);
            }

            return true;
        }
    );
}
