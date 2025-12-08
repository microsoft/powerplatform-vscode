/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { SiteTreeItem } from "../tree-items/SiteTreeItem";
import { Constants } from "../Constants";
import CurrentSiteContext from "../CurrentSiteContext";
import { traceError, traceInfo } from "../TelemetryHelper";

export const revealInOS = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_REVEAL_IN_OS_CALLED, { methodName: revealInOS.name });
    try {
        let folderPath = CurrentSiteContext.currentSiteFolderPath;
        if (siteTreeItem && siteTreeItem.contextValue === Constants.ContextValues.OTHER_SITE) {
            folderPath = siteTreeItem.siteInfo.folderPath || "";
        }

        if (!folderPath) {
            return;
        }

        traceInfo(Constants.EventNames.ACTIONS_HUB_REVEAL_IN_OS_SUCCESSFUL, { methodName: revealInOS.name });
        await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(folderPath));
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_REVEAL_IN_OS_FAILED, error as Error, { methodName: revealInOS.name });
    }
}
