/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "../ActionsHubTreeItem";
import { Constants } from "../../Constants";

/**
 * Subtext tree item shown when no Power Pages site is detected in the workspace.
 * Displays instructions to open a folder with a Power Pages site.
 */
export class MetadataDiffWelcomeNoSiteTreeItem extends ActionsHubTreeItem {
    constructor() {
        super(
            Constants.Strings.METADATA_DIFF_WELCOME_NO_SITE_INSTRUCTION,
            vscode.TreeItemCollapsibleState.None,
            "",
            Constants.ContextValues.METADATA_DIFF_WELCOME_NO_SITE,
            ""
        );

        this.id = "metadataDiffWelcomeNoSite";
    }
}
