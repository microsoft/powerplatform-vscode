/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { SiteTreeItem } from "./SiteTreeItem";
import { NoSitesTreeItem } from "./NoSitesTreeItem";
import { WebsiteStatus } from "../models/WebsiteStatus";
import { IWebsiteDetails } from "../../../../common/services/Interfaces";
import { WebsiteDataModel } from "../../../../common/services/Constants";
import { IWebsiteInfo } from "../models/IWebsiteInfo";

export class InactiveGroupTreeItem extends ActionsHubTreeItem {
    private readonly _inactiveSites: IWebsiteDetails[];

    constructor(inactiveSites: IWebsiteDetails[]) {
        super(
            Constants.Strings.INACTIVE_SITES,
            vscode.TreeItemCollapsibleState.Expanded,
            Constants.Icons.SITE_GROUP,
            Constants.ContextValues.INACTIVE_SITES_GROUP
        )
        this._inactiveSites = inactiveSites;
    }

    public getChildren(): ActionsHubTreeItem[] {
        if (!this._inactiveSites || !this._inactiveSites.length) {
            return [new NoSitesTreeItem()];
        }

        return this._inactiveSites.map(site => {
            const siteInfo: IWebsiteInfo = {
                name: site.Name,
                websiteId: site.WebsiteRecordId,
                dataModelVersion: site.DataModel == WebsiteDataModel.Standard ? 1 : 2,
                websiteUrl: site.WebsiteUrl,
                status: WebsiteStatus.Inactive,
                isCurrent: false
            };
            return new SiteTreeItem(siteInfo);
        });
    }
}
