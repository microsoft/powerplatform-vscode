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
import { SiteVisibility } from "../../models/SiteVisibility";
import { getAllFiles } from "../../ActionsHubUtils";
import MetadataDiffContext from "../../MetadataDiffContext";
import PacContext from "../../../../pac/PacContext";

/**
 * Result of resolving site information from workspace
 */
export interface SiteResolutionResult {
    siteId: string;
    localSitePath: string;
    /**
     * The relative path from site root to the folder user clicked on.
     * Empty string means the entire site should be compared.
     */
    comparisonSubPath: string;
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
    let comparisonSubPath = "";

    // Strategy 1: If resource is provided, traverse up from resource to find website.yml
    // This takes priority as it identifies the specific site the user clicked on
    if (resource?.fsPath) {
        const websiteYmlFolder = findWebsiteYmlFolder(resource.fsPath);
        if (websiteYmlFolder) {
            siteId = getWebsiteRecordId(websiteYmlFolder);
            localSitePath = websiteYmlFolder;

            // Calculate the relative path from site root to the resource
            // This allows comparing only the specific folder the user clicked on
            const resourcePath = resource.fsPath;
            if (resourcePath.startsWith(websiteYmlFolder)) {
                const relativePath = path.relative(websiteYmlFolder, resourcePath);
                // Only set comparisonSubPath if the resource is different from the site root
                if (relativePath && relativePath !== "." && !relativePath.startsWith("..")) {
                    comparisonSubPath = relativePath;
                }
            }
        }
    }

    // Strategy 2: Check if website.yml exists directly in working directory
    if (!siteId) {
        siteId = getWebsiteRecordId(workingDirectory);
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

    return { siteId, localSitePath, comparisonSubPath };
}

/**
 * Prepares the storage path for downloading sites for comparison
 * @param storagePath The extension storage path
 * @returns The prepared site storage path
 */
export function prepareSiteStoragePath(storagePath: string, websiteId: string): string {
    const siteStoragePath = path.join(storagePath, "sites-for-comparison", websiteId);

    if (!fs.existsSync(siteStoragePath)) {
        fs.mkdirSync(siteStoragePath, { recursive: true });
    }

    return siteStoragePath;
}

/**
 * Processes comparison results and updates the MetadataDiffContext
 * @param siteStoragePath Path where site was downloaded
 * @param localSitePath Path to local site
 * @param siteName Name of the remote site being compared
 * @param localSiteName Name of the local site
 * @param environmentName Name of the environment
 * @param methodName Name of the calling method for telemetry
 * @param siteId Site ID for telemetry
 * @param completedEventName Telemetry event name for completion
 * @param noDifferencesEventName Telemetry event name for no differences
 * @param comparisonSubPath Optional sub-path to filter comparison results to a specific folder
 * @param environmentId Optional environment ID (defaults to current environment if not provided)
 * @param dataModelVersion Optional data model version (1 = Standard, 2 = Enhanced)
 * @param websiteUrl Optional website URL
 * @param siteVisibility Optional site visibility
 * @param creator Optional creator of the site
 * @param createdOn Optional ISO 8601 timestamp when the site was created
 * @returns True if differences were found, false otherwise
 */
export async function processComparisonResults(
    siteStoragePath: string,
    localSitePath: string,
    siteName: string,
    localSiteName: string,
    environmentName: string,
    methodName: string,
    siteId: string,
    completedEventName: string,
    noDifferencesEventName: string,
    comparisonSubPath?: string,
    environmentId?: string,
    dataModelVersion?: 1 | 2,
    websiteUrl?: string,
    siteVisibility?: SiteVisibility,
    creator?: string,
    createdOn?: string
): Promise<boolean> {
    const comparisonResults = await showProgressWithNotification(
        Constants.Strings.COMPARING_FILES,
        async () => {
            // Find the actual downloaded site folder (name is not deterministic)
            const downloadedFolders = fs.readdirSync(siteStoragePath, { withFileTypes: true })
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);

            const siteDownloadPath = path.join(siteStoragePath, downloadedFolders[0]);
            let results = compareFiles(siteDownloadPath, localSitePath);

            // Filter results to only include files under the comparison sub-path
            if (comparisonSubPath) {
                const normalizedSubPath = comparisonSubPath.replace(/\\/g, "/");
                results = results.filter(result => {
                    const normalizedRelativePath = result.relativePath.replace(/\\/g, "/");
                    return normalizedRelativePath.startsWith(normalizedSubPath + "/") ||
                        normalizedRelativePath === normalizedSubPath;
                });
            }

            return results;
        }
    );

    // Handle results after progress notification is dismissed
    if (comparisonResults.length === 0) {
        traceInfo(noDifferencesEventName, {
            methodName,
            siteId
        });
        // Don't await - show notification without blocking so callers can update UI immediately
        vscode.window.showInformationMessage(Constants.Strings.NO_DIFFERENCES_FOUND);
        return false;
    } else {
        traceInfo(completedEventName, {
            methodName,
            siteId,
            totalDifferences: comparisonResults.length.toString(),
            modifiedFiles: comparisonResults.filter(r => r.status === FileComparisonStatus.MODIFIED).length.toString(),
            addedFiles: comparisonResults.filter(r => r.status === FileComparisonStatus.ADDED).length.toString(),
            deletedFiles: comparisonResults.filter(r => r.status === FileComparisonStatus.DELETED).length.toString()
        });

        // Get the environment ID from context if not provided
        const resolvedEnvironmentId = environmentId || PacContext.AuthInfo?.EnvironmentId || "";

        // Store results in the context so the tree view can display them
        MetadataDiffContext.setResults(
            comparisonResults,
            siteName,
            localSiteName,
            environmentName,
            siteId,
            resolvedEnvironmentId,
            false, // isImported
            undefined, // exportedAt
            dataModelVersion,
            websiteUrl,
            siteVisibility,
            creator,
            createdOn
        );
        return true;
    }
}
