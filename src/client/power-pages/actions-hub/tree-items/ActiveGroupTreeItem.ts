/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { Constants } from "../Constants";
import { SiteTreeItem } from "./SiteTreeItem";
import { IWebsiteInfo } from "../models/IWebsiteInfo";
import { NoSitesTreeItem } from "./NoSitesTreeItem";

export class ActiveGroupTreeItem extends ActionsHubTreeItem {
    private readonly _activeSites: IWebsiteInfo[];

    constructor(activeSites: IWebsiteInfo[]) {
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

        return this._activeSites.map(siteInfo => new SiteTreeItem(siteInfo));
    }
}
