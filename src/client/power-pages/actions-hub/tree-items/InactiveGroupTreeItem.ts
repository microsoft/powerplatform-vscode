/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { Constants } from "../Constants";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { SiteTreeItem } from "./SiteTreeItem";
import { IWebsiteInfo } from "../models/IWebsiteInfo";
import { NoSitesTreeItem } from "./NoSitesTreeItem";

export class InactiveGroupTreeItem extends ActionsHubTreeItem {
    private readonly _inactiveSites: IWebsiteInfo[];

    constructor(inactiveSites: IWebsiteInfo[]) {
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

        return this._inactiveSites.map(siteInfo => new SiteTreeItem(siteInfo));
    }
}
