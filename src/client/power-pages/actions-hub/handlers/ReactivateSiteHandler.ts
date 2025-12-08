/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import PacContext from "../../../pac/PacContext";
import { getStudioBaseUrl } from "../ActionsHubUtils";
import { Constants } from "../Constants";
import { traceError, traceInfo } from "../TelemetryHelper";
import { SiteTreeItem } from "../tree-items/SiteTreeItem";

export const reactivateSite = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_REACTIVATE_SITE_CALLED, { siteId: siteTreeItem.siteInfo.websiteId, methodName: reactivateSite.name });

    const { websiteId, name, websiteUrl, languageCode, dataModelVersion } = siteTreeItem.siteInfo;
    const environmentId = PacContext.AuthInfo?.EnvironmentId || "";

    if (!websiteId || !environmentId || !name || !languageCode || !dataModelVersion) {
        traceError(Constants.EventNames.ACTIONS_HUB_SITE_REACTIVATION_FAILED, new Error(Constants.EventNames.ACTIONS_HUB_SITE_REACTIVATION_FAILED), { methodName: reactivateSite.name });

        await vscode.window.showErrorMessage(Constants.Strings.MISSING_REACTIVATION_URL_INFO);
        return;
    }

    const isNewDataModel = siteTreeItem.siteInfo.dataModelVersion === 2;

    let siteAddress = websiteUrl;
    if (siteAddress === null || siteAddress === undefined) {
        siteAddress = ""; // Studio generates a new URL for the site
    }

    const reactivateSiteUrl = `${getStudioBaseUrl()}/e/${environmentId}/portals/create?reactivateWebsiteId=${websiteId}&siteName=${encodeURIComponent(name)}&siteAddress=${encodeURIComponent(siteAddress)}&siteLanguageId=${languageCode}&isNewDataModel=${isNewDataModel}`;

    await vscode.env.openExternal(vscode.Uri.parse(reactivateSiteUrl));
};
