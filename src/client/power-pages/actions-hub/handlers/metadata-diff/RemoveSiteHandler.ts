/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { MetadataDiffSiteTreeItem } from "../../tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";
import MetadataDiffContext from "../../MetadataDiffContext";

/**
 * Removes a specific site's comparison results from the metadata diff view
 */
export function removeSiteComparison(siteItem: MetadataDiffSiteTreeItem): void {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_CLEAR, {
        methodName: removeSiteComparison.name,
        siteName: siteItem.siteName
    });

    MetadataDiffContext.clearSite(siteItem.siteName);
}
