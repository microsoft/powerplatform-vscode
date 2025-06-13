/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants"
import { ActionsHubTreeItem } from "./ActionsHubTreeItem"
import { IOtherSiteInfo } from "../../../../common/services/Interfaces";
import { IWebsiteInfo } from "../models/IWebsiteInfo";
import { SiteTreeItem } from "./SiteTreeItem";

export class OtherSitesGroupTreeItem extends ActionsHubTreeItem {
    private _otherSites: IOtherSiteInfo[] = [];


    constructor(otherSites: IOtherSiteInfo[]) {
        super(
            Constants.Strings.OTHER_SITES,
            vscode.TreeItemCollapsibleState.Collapsed,
            Constants.Icons.OTHER_SITES,
            Constants.ContextValues.OTHER_SITES_GROUP
        );
        this._otherSites = otherSites;
    }

    public getChildren(): ActionsHubTreeItem[] {
        return this._otherSites.map(site => {
            const siteInfo: IWebsiteInfo = {
                name: site.name,
                websiteId: site.websiteId || '',
                dataModelVersion: 2, // For other sites, we don't have this information. Defaulting to 2 and will rely on current sites to determine the data model for operations.
                status: undefined,
                isCurrent: false,
                websiteUrl: "",
                siteVisibility: undefined,
                siteManagementUrl: "",
                folderPath : site.folderPath,
                createdOn: "",
                creator: "",
                isCodeSite: site.isCodeSite
            };
            return new SiteTreeItem(siteInfo);
        });

    }
}
