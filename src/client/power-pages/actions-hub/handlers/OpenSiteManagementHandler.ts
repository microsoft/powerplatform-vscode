/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants";
import { traceInfo, traceError } from "../TelemetryHelper";
import { SiteTreeItem } from "../tree-items/SiteTreeItem";

export const openSiteManagement = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_OPEN_SITE_MANAGEMENT_CALLED, { methodName: openSiteManagement.name, siteId: siteTreeItem.siteInfo.websiteId });
    try {
        if (!siteTreeItem.siteInfo.siteManagementUrl) {
            vscode.window.showErrorMessage(vscode.l10n.t(Constants.Strings.SITE_MANAGEMENT_URL_NOT_FOUND));
            traceError(
                Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND,
                new Error(Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND),
                { method: openSiteManagement.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            return;
        }

        traceInfo(Constants.EventNames.ACTIONS_HUB_OPEN_SITE_MANAGEMENT_SUCCESSFUL, { methodName: openSiteManagement.name, siteId: siteTreeItem.siteInfo.websiteId });
        await vscode.env.openExternal(vscode.Uri.parse(siteTreeItem.siteInfo.siteManagementUrl));
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_OPEN_SITE_MANAGEMENT_FAILED, error as Error, { methodName: openSiteManagement.name, siteId: siteTreeItem.siteInfo.websiteId });
    }
}
