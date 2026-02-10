/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { SiteTreeItem } from "../tree-items/SiteTreeItem";
import { Constants } from "../Constants";
import { traceError, traceInfo } from "../TelemetryHelper";
import { PreviewSite } from "../../preview-site/PreviewSite";
import { Messages } from "../../preview-site/Constants";
import * as vscode from "vscode";

export const clearCache = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_CLEAR_CACHE_CALLED, { methodName: clearCache.name });
    try {
        await PreviewSite.clearCache(siteTreeItem.siteInfo.websiteUrl, Messages.CLEARING_SITE_CACHE);
        await vscode.window.showInformationMessage(Constants.Strings.CLEAR_CACHE_SUCCESS);
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_CLEAR_CACHE_FAILED, error as Error, { methodName: clearCache.name });
    }
};
