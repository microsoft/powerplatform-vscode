/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { IEnvironmentInfo } from "../models/IEnvironmentInfo";
import { Constants } from "../Constants";
import { ActiveGroupTreeItem } from "./ActiveGroupTreeItem";
import { InactiveGroupTreeItem } from "./InactiveGroupTreeItem";
import { IWebsiteInfo } from "../models/IWebsiteInfo";

export class EnvironmentGroupTreeItem extends ActionsHubTreeItem {
    environmentInfo: IEnvironmentInfo = {} as IEnvironmentInfo;
    private readonly _activeSites: IWebsiteInfo[];
    private readonly _inactiveSites: IWebsiteInfo[];

    constructor(environmentInfo: IEnvironmentInfo, context: vscode.ExtensionContext, activeSites: IWebsiteInfo[], inactiveSites: IWebsiteInfo[]) {
        super(
            environmentInfo.currentEnvironmentName,
        vscode.TreeItemCollapsibleState.Expanded,
            {
                light: vscode.Uri.joinPath(context.extensionUri, 'src', 'client', 'assets', 'environment-icon', 'light', 'environment.svg'),
                dark: vscode.Uri.joinPath(context.extensionUri, 'src', 'client', 'assets', 'environment-icon', 'dark', 'environment.svg')
            },
            Constants.ContextValues.ENVIRONMENT_GROUP);
        this.environmentInfo = environmentInfo;
        this._activeSites = activeSites;
        this._inactiveSites = inactiveSites;
    }

    public getChildren(): ActionsHubTreeItem[] {
        return [
            new ActiveGroupTreeItem(this._activeSites),
            new InactiveGroupTreeItem(this._inactiveSites)
        ];
    }
}
