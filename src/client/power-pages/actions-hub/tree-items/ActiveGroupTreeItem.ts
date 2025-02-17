/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { Constants } from "../Constants";
import { SiteTreeItem } from "./SiteTreeItem";
import { NoSitesTreeItem } from "./NoSitesTreeItem";
import CurrentSiteContext from "../CurrentSiteContext";
import { WebsiteStatus } from "../models/WebsiteStatus";
import { IWebsiteDetails } from "../../../../common/services/Interfaces";
import { WebsiteDataModel } from "../../../../common/services/Constants";
import { IWebsiteInfo } from "../models/IWebsiteInfo";

export class ActiveGroupTreeItem extends ActionsHubTreeItem {
    private readonly _activeSites: IWebsiteDetails[];

    constructor(activeSites: IWebsiteDetails[]) {
        super(
            Constants.Strings.ACTIVE_SITES,
            vscode.TreeItemCollapsibleState.Expanded,
            Constants.Icons.SITE_GROUP,
            Constants.ContextValues.ACTIVE_SITES_GROUP
        );
        this._activeSites = activeSites;
    }

    public getChildren(): ActionsHubTreeItem[] {
        if (!this._activeSites || !this._activeSites.length) {
            return [new NoSitesTreeItem()];
        }

        return this._activeSites.map((site) => {
            const siteInfo: IWebsiteInfo = {
                name: site.Name,
                websiteId: site.WebsiteRecordId,
                dataModelVersion: site.DataModel == WebsiteDataModel.Standard ? 1 : 2,
                websiteUrl: site.WebsiteUrl,
                status: WebsiteStatus.Active,
                isCurrent: CurrentSiteContext.currentSiteId === site.WebsiteRecordId
            };

            return new SiteTreeItem(siteInfo);
        });
    }
}
