/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { PacTerminal } from "../../../../lib/PacTerminal";
import { Constants } from "../../Constants";
import { traceError, traceInfo } from "../../TelemetryHelper";
import { SiteTreeItem } from "../../tree-items/SiteTreeItem";
import { findPowerPagesSiteFolder, getWebsiteRecordId } from "../../../../../common/utilities/WorkspaceInfoFinderUtil";
import { POWERPAGES_SITE_FOLDER } from "../../../../../common/constants";
import { showProgressWithNotification } from "../../../../../common/utilities/Utils";
import { IFileComparisonResult } from "../../models/IFileComparisonResult";
import { getAllFiles } from "../../ActionsHubUtils";
import MetadataDiffContext from "../../MetadataDiffContext";
import PacContext from "../../../../pac/PacContext";

/**
 * Compares files between downloaded site and local workspace
 * @param downloadedSitePath Path to the downloaded site
 * @param localSitePath Path to the local site
 * @returns Array of file comparison results
 */
function compareFiles(downloadedSitePath: string, localSitePath: string): IFileComparisonResult[] {
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
                    status: "modified"
                });
            }
        } else {
            // File exists in remote but not locally - deleted locally
            results.push({
                localPath: path.join(localSitePath, relativePath),
                remotePath,
                relativePath,
                status: "deleted"
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
                status: "added"
            });
        }
    }

    return results;
}

export const compareWithLocal = (pacTerminal: PacTerminal, context: vscode.ExtensionContext) => async (siteTreeItem: SiteTreeItem): Promise<void> => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_CALLED, {
        methodName: compareWithLocal.name,
        siteId: siteTreeItem.siteInfo.websiteId,
        dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
    });

    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_NO_WORKSPACE, {
            methodName: compareWithLocal.name
        });
        await vscode.window.showErrorMessage(Constants.Strings.NO_WORKSPACE_FOLDER_OPEN);
        return;
    }

    const workingDirectory = workspaceFolders[0].uri.fsPath;
    let siteId = getWebsiteRecordId(workingDirectory);

    if (!siteId) {
        const powerPagesSiteFolder = findPowerPagesSiteFolder(workingDirectory);

        if (powerPagesSiteFolder) {
            siteId = getWebsiteRecordId(path.join(powerPagesSiteFolder, POWERPAGES_SITE_FOLDER));
        }
    }

    if (!siteId) {
        traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_WEBSITE_ID_NOT_FOUND, {
            methodName: compareWithLocal.name
        });
        await vscode.window.showErrorMessage(Constants.Strings.WEBSITE_ID_NOT_FOUND);
        return;
    }

    const storagePath = context.storageUri?.fsPath;

    if (!storagePath) {
        return;
    }

    const siteStoragePath = path.join(storagePath, "sites-for-comparison");

    if (fs.existsSync(siteStoragePath)) {
        fs.rmSync(siteStoragePath, { recursive: true, force: true });
    }

    fs.mkdirSync(siteStoragePath, { recursive: true });

    const pacWrapper = pacTerminal.getWrapper();

    const success = await showProgressWithNotification(
        vscode.l10n.t(Constants.Strings.DOWNLOADING_SITE_FOR_COMPARISON, siteTreeItem.siteInfo.name),
        async () => pacWrapper.downloadSiteWithProgress(
            siteStoragePath,
            siteTreeItem.siteInfo.websiteId,
            siteTreeItem.siteInfo.dataModelVersion
        )
    );

    if (!success) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_DOWNLOAD_FAILED,
            new Error("MetadataDiff: Action 'compare with local' failed to download site."),
            {
                methodName: compareWithLocal.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
            }
        );
        await vscode.window.showErrorMessage(Constants.Strings.COMPARE_WITH_LOCAL_SITE_DOWNLOAD_FAILED);
        return;
    }

    // Determine the local site path
    let localSitePath = workingDirectory;
    const powerPagesSiteFolder = findPowerPagesSiteFolder(workingDirectory);
    if (powerPagesSiteFolder) {
        localSitePath = path.join(powerPagesSiteFolder, POWERPAGES_SITE_FOLDER);
    }

    // Compare files between downloaded site and local workspace
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
                traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_NO_DIFFERENCES, {
                    methodName: compareWithLocal.name,
                    siteId: siteTreeItem.siteInfo.websiteId
                });
                await vscode.window.showInformationMessage(Constants.Strings.NO_DIFFERENCES_FOUND);
                MetadataDiffContext.clear();
            } else {
                traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_COMPLETED, {
                    methodName: compareWithLocal.name,
                    siteId: siteTreeItem.siteInfo.websiteId,
                    totalDifferences: comparisonResults.length.toString(),
                    modifiedFiles: comparisonResults.filter(r => r.status === "modified").length.toString(),
                    addedFiles: comparisonResults.filter(r => r.status === "added").length.toString(),
                    deletedFiles: comparisonResults.filter(r => r.status === "deleted").length.toString()
                });

                // Store results in the context so the tree view can display them
                const environmentName = PacContext.AuthInfo?.OrganizationFriendlyName || "";
                MetadataDiffContext.setResults(comparisonResults, siteTreeItem.siteInfo.name, environmentName);
            }

            return true;
        }
    );

    await vscode.window.showInformationMessage(Constants.Strings.COMPARE_WITH_LOCAL_COMPLETED);
}
