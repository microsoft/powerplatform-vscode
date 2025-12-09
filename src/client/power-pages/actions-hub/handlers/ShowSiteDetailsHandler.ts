/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import moment from "moment";
import { Constants } from "../Constants";
import { traceError, traceInfo } from "../TelemetryHelper";
import { WebsiteDataModel } from "../../../../common/services/Constants";
import { SiteTreeItem } from "../tree-items/SiteTreeItem";

export const showSiteDetails = async (siteTreeItem: SiteTreeItem) => {
    const siteInfo = siteTreeItem.siteInfo;

    traceInfo(
        Constants.EventNames.ACTIONS_HUB_SHOW_SITE_DETAILS_CALLED,
        {
            methodName: showSiteDetails.name,
            siteId: siteInfo.websiteId,
            dataModelVersion: siteInfo.dataModelVersion
        }
    );

    try {
        const details = [
            vscode.l10n.t({ message: "Friendly name: {0}", args: [siteInfo.name], comment: "{0} is the website name" }),
            vscode.l10n.t({ message: "Website Id: {0}", args: [siteInfo.websiteId], comment: "{0} is the website ID" }),
            vscode.l10n.t({ message: "Data model version: {0}", args: [siteInfo.dataModelVersion === 1 ? WebsiteDataModel.Standard : WebsiteDataModel.Enhanced], comment: "{0} is the data model version" })
        ];

        if (siteInfo.websiteUrl) {
            details.push(vscode.l10n.t({ message: "Website Url: {0}", args: [siteInfo.websiteUrl], comment: "{0} is the website Url" }));
        }

        if (siteInfo.siteVisibility) {
            const visibility = siteInfo.siteVisibility.charAt(0).toUpperCase() + siteInfo.siteVisibility.slice(1).toLowerCase();
            details.push(vscode.l10n.t({ message: "Site visibility: {0}", args: [visibility], comment: "{0} is the site visibility" }));
        }

        details.push(vscode.l10n.t({ message: "Creator: {0}", args: [siteInfo.creator], comment: "{0} is the creator" }));
        details.push(vscode.l10n.t({ message: "Created on: {0}", args: [moment(siteInfo.createdOn).format('LL')], comment: "{0} is the created date" }));

        const formattedDetails = details.join('\n');

        const result = await vscode.window.showInformationMessage(Constants.Strings.SITE_DETAILS, { detail: formattedDetails, modal: true }, Constants.Strings.COPY_TO_CLIPBOARD);

        if (result === Constants.Strings.COPY_TO_CLIPBOARD) {
            traceInfo(
                Constants.EventNames.ACTIONS_HUB_SHOW_SITE_DETAILS_COPY_TO_CLIPBOARD,
                {
                    methodName: showSiteDetails.name,
                    siteId: siteInfo.websiteId,
                    dataModelVersion: siteInfo.dataModelVersion
                }
            );
            await vscode.env.clipboard.writeText(formattedDetails);
        }
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_SHOW_SITE_DETAILS_FAILED,
            error as Error,
            {
                methodName: showSiteDetails.name,
                siteId: siteInfo.websiteId,
                dataModelVersion: siteInfo.dataModelVersion
            }
        );
    }
}
