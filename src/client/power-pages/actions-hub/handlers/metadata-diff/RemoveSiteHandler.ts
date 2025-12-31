/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffSiteTreeItem } from "../../tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";
import MetadataDiffContext from "../../MetadataDiffContext";

/**
 * Removes a specific site's comparison results from the metadata diff view after user confirmation
 */
export async function removeSiteComparison(siteItem: MetadataDiffSiteTreeItem): Promise<void> {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_CLEAR, {
        methodName: removeSiteComparison.name,
        siteName: siteItem.siteName
    });

    const confirmButton = Constants.Strings.CLEAR;
    const result = await vscode.window.showWarningMessage(
        Constants.Strings.CLEAR_RESULT_TITLE,
        { modal: true, detail: Constants.Strings.CLEAR_RESULT_MESSAGE },
        confirmButton
    );

    if (result !== confirmButton) {
        return;
    }

    MetadataDiffContext.clearSite(siteItem.siteName);
}
