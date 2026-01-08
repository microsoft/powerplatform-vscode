/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "../ActionsHubTreeItem";
import { Constants } from "../../Constants";

/**
 * CTA tree item shown when a Power Pages site is detected in the workspace.
 * Clicking this triggers the "Compare with Environment" command.
 */
export class MetadataDiffWelcomeCTATreeItem extends ActionsHubTreeItem {
    constructor() {
        super(
            Constants.Strings.METADATA_DIFF_COMPARE_SITE_CTA,
            vscode.TreeItemCollapsibleState.None,
            "",
            Constants.ContextValues.METADATA_DIFF_WELCOME_WITH_SITE,
            ""
        );

        this.id = "metadataDiffWelcomeCTA";

        // Make this item clickable to trigger compare with environment
        this.command = {
            command: Constants.Commands.COMPARE_WITH_ENVIRONMENT,
            title: Constants.Strings.METADATA_DIFF_COMPARE_SITE_CTA
        };
    }
}
