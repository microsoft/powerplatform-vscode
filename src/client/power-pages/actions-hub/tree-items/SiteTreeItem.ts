/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { IWebsiteInfo } from "../models/IWebsiteInfo";
import { Constants } from "../Constants";
import { WebsiteStatus } from "../models/WebsiteStatus";

export class SiteTreeItem extends ActionsHubTreeItem {
    constructor(
        public readonly siteInfo: IWebsiteInfo
    ) {
        super(
            siteInfo.name,
            vscode.TreeItemCollapsibleState.None,
            Constants.Icons.SITE,
            SiteTreeItem.getContextValue(siteInfo),
            siteInfo.isCurrent ? Constants.Strings.CURRENT : ""
        )
    }

    private static getContextValue(siteInfo: IWebsiteInfo): string {
        if (siteInfo.status === WebsiteStatus.Active && siteInfo.isCurrent) {
            return Constants.ContextValues.CURRENT_ACTIVE_SITE;
        }

        if (siteInfo.status === WebsiteStatus.Active && !siteInfo.isCurrent) {
            return Constants.ContextValues.NON_CURRENT_ACTIVE_SITE;
        }

        if (siteInfo.status === WebsiteStatus.Inactive) {
            return Constants.ContextValues.INACTIVE_SITE;
        }

        return Constants.ContextValues.OTHER_SITE;
    }
}
