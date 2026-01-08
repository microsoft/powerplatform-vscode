/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacTerminal } from "../../../../lib/PacTerminal";
import { Constants } from "../../Constants";
import { traceError, traceInfo } from "../../TelemetryHelper";
import { showProgressWithNotification } from "../../../../../common/utilities/Utils";
import { MetadataDiffSiteTreeItem } from "../../tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { resolveSiteFromWorkspace, prepareSiteStoragePath, processComparisonResults } from "./MetadataDiffUtils";
import MetadataDiffContext from "../../MetadataDiffContext";

/**
 * Re-syncs (refreshes) the comparison results for a specific site by re-downloading
 * the site metadata from the environment and re-running the comparison.
 * This is useful when the remote site has been updated since the last comparison.
 */
export const resyncMetadataDiff = (pacTerminal: PacTerminal, context: vscode.ExtensionContext) => async (siteItem: MetadataDiffSiteTreeItem): Promise<void> => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_RESYNC_CALLED, {
        methodName: resyncMetadataDiff.name,
        siteName: siteItem.siteName,
        environmentName: siteItem.environmentName,
        websiteId: siteItem.websiteId,
        environmentId: siteItem.environmentId,
        isImported: siteItem.isImported
    });

    // Cannot resync imported comparisons - they are static snapshots
    if (siteItem.isImported) {
        vscode.window.showWarningMessage(Constants.Strings.METADATA_DIFF_CANNOT_RESYNC_IMPORTED);
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_NO_WORKSPACE, {
            methodName: resyncMetadataDiff.name
        });
        await vscode.window.showErrorMessage(Constants.Strings.NO_WORKSPACE_FOLDER_OPEN);
        return;
    }

    const siteResolution = resolveSiteFromWorkspace(workspaceFolders[0].uri.fsPath);

    if (!siteResolution) {
        traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_WEBSITE_ID_NOT_FOUND, {
            methodName: resyncMetadataDiff.name
        });
        await vscode.window.showErrorMessage(Constants.Strings.WEBSITE_ID_NOT_FOUND);
        return;
    }

    const storagePath = context.storageUri?.fsPath;

    if (!storagePath) {
        return;
    }

    const siteStoragePath = prepareSiteStoragePath(storagePath, siteItem.websiteId);
    const pacWrapper = pacTerminal.getWrapper();

    // Use the data model version from the existing comparison results
    // Default to version 1 if not available (e.g., for older comparisons)
    const dataModelVersion: 1 | 2 = siteItem.dataModelVersion ?? 1;

    const downloadStartTime = Date.now();
    let success: boolean;

    if (siteItem.isCodeSite) {
        success = await showProgressWithNotification(
            Constants.StringFunctions.RESYNCING_SITE_COMPARISON(siteItem.siteName),
            async () => pacWrapper.downloadCodeSiteWithProgress(
                siteStoragePath,
                siteItem.websiteId
            )
        );
    } else {
        success = await showProgressWithNotification(
            Constants.StringFunctions.RESYNCING_SITE_COMPARISON(siteItem.siteName),
            async () => pacWrapper.downloadSiteWithProgress(
                siteStoragePath,
                siteItem.websiteId,
                dataModelVersion
            )
        );
    }
    const downloadDurationMs = Date.now() - downloadStartTime;

    if (!success) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_RESYNC_FAILED,
            new Error("MetadataDiff: Action 'resync' failed to download site."),
            {
                methodName: resyncMetadataDiff.name,
                websiteId: siteItem.websiteId,
                environmentId: siteItem.environmentId
            }
        );
        await vscode.window.showErrorMessage(Constants.Strings.COMPARE_WITH_LOCAL_SITE_DOWNLOAD_FAILED);
        return;
    }

    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_SITE_DOWNLOAD_COMPLETED, {
        methodName: resyncMetadataDiff.name,
        siteId: siteItem.websiteId,
        environmentId: siteItem.environmentId,
        downloadDurationMs: downloadDurationMs
    });

    const hasDifferences = await processComparisonResults(
        siteStoragePath,
        siteResolution.localSitePath,
        siteItem.siteName,
        siteItem.localSiteName,
        siteItem.environmentName,
        resyncMetadataDiff.name,
        siteItem.websiteId,
        Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_RESYNC_COMPLETED,
        Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_RESYNC_NO_DIFFERENCES,
        undefined, // No sub-path filtering for resync
        siteItem.environmentId,
        dataModelVersion,
        siteItem.websiteUrl,
        siteItem.siteVisibility,
        siteItem.creator,
        siteItem.createdOn,
        siteItem.isCodeSite
    );

    if (hasDifferences) {
        await vscode.window.showInformationMessage(Constants.Strings.METADATA_DIFF_RESYNC_COMPLETED);
    } else {
        // Remove the comparison node since there are no more differences
        MetadataDiffContext.clearSiteByKey(siteItem.websiteId, siteItem.environmentId, siteItem.isImported);
    }
};
