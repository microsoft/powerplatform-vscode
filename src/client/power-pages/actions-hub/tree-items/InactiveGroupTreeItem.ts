/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { IWebsiteDetails } from "../../../../common/services/Interfaces";
import { SiteTreeItem } from "./SiteTreeItem";
import { IWebsiteInfo } from "../models/IWebsiteInfo";
import { WebsiteDataModel } from "../../../../common/services/Constants";
import { WebsiteStatus } from "../models/WebsiteStatus";

export class InactiveGroupTreeItem extends ActionsHubTreeItem {
    private readonly _inactiveSites: IWebsiteDetails[];
    
    constructor(inactiveSites: IWebsiteDetails[]) {
        super(
            Constants.Strings.INACTIVE_SITES,
            vscode.TreeItemCollapsibleState.Collapsed,
            Constants.Icons.SITE_GROUP,
            Constants.ContextValues.INACTIVE_SITES_GROUP
        )
        this._inactiveSites = inactiveSites;
    }

    public getChildren(): ActionsHubTreeItem[] {
        return this._inactiveSites.map(site => {
            const siteInfo: IWebsiteInfo = {
                name: site.name,
                dataModelVersion: site.dataModel == WebsiteDataModel.Standard ? 1 : 2,
                websiteUrl: site.websiteUrl,
                status: WebsiteStatus.Inactive
            };
            const siteItem = new SiteTreeItem(siteInfo);
            return siteItem;
        });
    }
}
