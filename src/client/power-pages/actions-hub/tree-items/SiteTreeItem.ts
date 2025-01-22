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
        siteInfo: IWebsiteInfo
    ) {
        super(
            siteInfo.name,
            vscode.TreeItemCollapsibleState.None,
            Constants.Icons.SITE,
            SiteTreeItem.getContextValue(siteInfo)
        )
    }

    private static getContextValue(websiteInfo: IWebsiteInfo): string {
        switch (websiteInfo.status) {
            case WebsiteStatus.Active:
                return Constants.ContextValues.ACTIVE_SITE;
            case WebsiteStatus.Inactive:
                return Constants.ContextValues.INACTIVE_SITE;
            default:
                return Constants.ContextValues.OTHER_SITE;
        }
    }
}
