/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { PacTerminal } from "../../../lib/PacTerminal";
import { Constants } from "../Constants";
import { traceError, traceInfo } from "../TelemetryHelper";
import { SiteTreeItem } from "../tree-items/SiteTreeItem";
import { findPowerPagesSiteFolder, getWebsiteRecordId } from "../../../../common/utilities/WorkspaceInfoFinderUtil";
import { POWERPAGES_SITE_FOLDER } from "../../../../common/constants";
import { showProgressWithNotification } from "../../../../common/utilities/Utils";

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
        vscode.window.showErrorMessage(Constants.Strings.NO_WORKSPACE_FOLDER_OPEN);
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
        vscode.window.showErrorMessage(Constants.Strings.WEBSITE_ID_NOT_FOUND);
        return;
    }

    const storagePath = context.storageUri?.fsPath;

    if (!storagePath) {
        return;
    }

    const siteStoragePath = path.join(storagePath, siteTreeItem.siteInfo.websiteId);

    if (fs.existsSync(siteStoragePath)) {
        fs.rmSync(siteStoragePath, { recursive: true, force: true });
    }

    fs.mkdirSync(siteStoragePath, { recursive: true });

    const pacWrapper = pacTerminal.getWrapper();

    const success = await showProgressWithNotification(
        Constants.Strings.DOWNLOADING_SITE,
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
        vscode.window.showErrorMessage(Constants.Strings.COMPARE_WITH_LOCAL_SITE_DOWNLOAD_FAILED);
    }

    
}
