/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacTerminal } from "../../../../lib/PacTerminal";
import { Constants } from "../../Constants";
import { traceError, traceInfo } from "../../TelemetryHelper";
import { SiteTreeItem } from "../../tree-items/SiteTreeItem";
import { showProgressWithNotification } from "../../../../../common/utilities/Utils";
import PacContext from "../../../../pac/PacContext";
import { resolveSiteFromWorkspace, prepareSiteStoragePath, processComparisonResults } from "./MetadataDiffUtils";

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

    const siteResolution = resolveSiteFromWorkspace(workspaceFolders[0].uri.fsPath);

    if (!siteResolution) {
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

    const siteStoragePath = prepareSiteStoragePath(storagePath, siteTreeItem.siteInfo.websiteId);
    const pacWrapper = pacTerminal.getWrapper();

    const success = await showProgressWithNotification(
        Constants.StringFunctions.DOWNLOADING_SITE_FOR_COMPARISON(siteTreeItem.siteInfo.name),
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

    const environmentName = PacContext.AuthInfo?.OrganizationFriendlyName || "";

    await processComparisonResults(
        siteStoragePath,
        siteResolution.localSitePath,
        siteTreeItem.siteInfo.name,
        environmentName,
        compareWithLocal.name,
        siteTreeItem.siteInfo.websiteId,
        Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_COMPLETED,
        Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_NO_DIFFERENCES
    );

    await vscode.window.showInformationMessage(Constants.Strings.COMPARE_WITH_LOCAL_COMPLETED);
}
