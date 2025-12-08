/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import PacContext from "../../../pac/PacContext";
import { Constants } from "../Constants";
import { traceError, traceInfo } from "../TelemetryHelper";
import { getStudioBaseUrl } from "../ActionsHubUtils";
import { SiteTreeItem } from "../tree-items/SiteTreeItem";

const getPPHomeUrl = (): string => {
    const baseEndpoint = getStudioBaseUrl();

    if (!baseEndpoint) {
        return "";
    }

    return `${baseEndpoint}/environments/${PacContext.AuthInfo?.EnvironmentId}/portals/home`;
}

const getActiveSitesUrl = () => `${getPPHomeUrl()}/?tab=active`;

const getInactiveSitesUrl = () => `${getPPHomeUrl()}/?tab=inactive`;

export const openActiveSitesInStudio = async () => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_OPEN_ACTIVE_SITES_IN_STUDIO_CALLED, { methodName: openActiveSitesInStudio.name });
    try {
        await vscode.env.openExternal(vscode.Uri.parse(getActiveSitesUrl()));
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_OPEN_ACTIVE_SITES_IN_STUDIO_FAILED, error as Error, { methodName: openActiveSitesInStudio.name });
    }
};

export const openInactiveSitesInStudio = async () => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_OPEN_INACTIVE_SITES_IN_STUDIO_CALLED, { methodName: openInactiveSitesInStudio.name });
    try {
        await vscode.env.openExternal(vscode.Uri.parse(getInactiveSitesUrl()));
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_OPEN_INACTIVE_SITES_IN_STUDIO_FAILED, error as Error, { methodName: openInactiveSitesInStudio.name });
    }
};

const getStudioUrl = (environmentId: string, websiteId: string) => {
    if (!environmentId || !websiteId) {
        return "";
    }

    const baseEndpoint = getStudioBaseUrl();

    if (!baseEndpoint) {
        return "";
    }

    return `${baseEndpoint}/e/${environmentId}/sites/${websiteId}/pages`;
}

export const openSiteInStudio = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(
        Constants.EventNames.ACTIONS_HUB_OPEN_SITE_IN_STUDIO_CALLED,
        {
            methodName: openSiteInStudio.name,
            siteId: siteTreeItem.siteInfo.websiteId,
            dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
        }
    );
    try {
        const environmentId = PacContext.AuthInfo?.EnvironmentId || "";
        const studioUrl = getStudioUrl(environmentId, siteTreeItem.siteInfo.websiteId);

        if (!studioUrl) {
            return;
        }

        await vscode.env.openExternal(vscode.Uri.parse(studioUrl));
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_OPEN_SITE_IN_STUDIO_FAILED,
            error as Error,
            {
                methodName: openSiteInStudio.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
            }
        );
    }
}
