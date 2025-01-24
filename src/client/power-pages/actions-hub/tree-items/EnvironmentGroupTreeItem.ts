/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { IEnvironmentInfo } from "../models/IEnvironmentInfo";
import { Constants } from "../Constants";

export class EnvironmentGroupTreeItem extends ActionsHubTreeItem {
    constructor(environmentInfo: IEnvironmentInfo, context: vscode.ExtensionContext) {
        super(
            environmentInfo.currentEnvironmentName,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                light: vscode.Uri.joinPath(context.extensionUri, 'src', 'client', 'assets', 'environment-icon', 'light', 'environment.svg'),
                dark: vscode.Uri.joinPath(context.extensionUri, 'src', 'client', 'assets', 'environment-icon', 'dark', 'environment.svg')
            },
            Constants.ContextValues.ENVIRONMENT_GROUP);
    }
}
