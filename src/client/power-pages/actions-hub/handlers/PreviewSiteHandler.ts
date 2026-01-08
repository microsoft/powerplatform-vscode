/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { SiteTreeItem } from "../tree-items/SiteTreeItem";
import { Constants } from "../Constants";
import { traceError, traceInfo } from "../TelemetryHelper";
import { PreviewSite } from "../../preview-site/PreviewSite";

export const previewSite = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_PREVIEW_SITE_CALLED, { methodName: previewSite.name });
    try {
        await PreviewSite.clearCache(siteTreeItem.siteInfo.websiteUrl);

        await PreviewSite.launchBrowserAndDevToolsWithinVsCode(siteTreeItem.siteInfo.websiteUrl, siteTreeItem.siteInfo.dataModelVersion, siteTreeItem.siteInfo.siteVisibility);
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_PREVIEW_SITE_FAILED, error as Error, { methodName: previewSite.name });
    }
};
