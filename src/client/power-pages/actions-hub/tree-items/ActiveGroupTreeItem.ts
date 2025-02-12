/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { Constants } from "../Constants";
import { IWebsiteDetails } from "../../../../common/services/Interfaces";
import { SiteTreeItem } from "./SiteTreeItem";
import { IWebsiteInfo } from "../models/IWebsiteInfo";
import { WebsiteDataModel } from "../../../../common/services/Constants";
import { WebsiteStatus } from "../models/WebsiteStatus";
import { NoSitesTreeItem } from "./NoSitesTreeItem";

export class ActiveGroupTreeItem extends ActionsHubTreeItem {
    private readonly _activeSites: IWebsiteDetails[];

    constructor(activeSites: IWebsiteDetails[]) {
        super(
            Constants.Strings.ACTIVE_SITES,
            vscode.TreeItemCollapsibleState.Collapsed,
            Constants.Icons.SITE_GROUP,
            Constants.ContextValues.ACTIVE_SITES_GROUP
        )
        this._activeSites = activeSites;
    }

    public getChildren(): ActionsHubTreeItem[] {
        if (!this._activeSites || !this._activeSites.length) {
            return [new NoSitesTreeItem()];
        }

        return this._activeSites.map(site => {
            const siteInfo: IWebsiteInfo = {
                name: site.name,
                dataModelVersion: site.dataModel == WebsiteDataModel.Standard ? 1 : 2,
                websiteUrl: site.websiteUrl,
                status: WebsiteStatus.Active
            };
            const siteItem = new SiteTreeItem(siteInfo);
            return siteItem;
        });
    }
}
