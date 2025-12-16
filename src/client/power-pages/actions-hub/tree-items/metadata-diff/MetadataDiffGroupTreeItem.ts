/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "../ActionsHubTreeItem";
import { Constants } from "../../Constants";
import MetadataDiffContext from "../../MetadataDiffContext";
import { MetadataDiffSiteTreeItem } from "./MetadataDiffSiteTreeItem";

/**
 * Root group tree item for showing metadata diff comparison results.
 * This is always visible under the Tools node and shows site children when comparisons exist.
 */
export class MetadataDiffGroupTreeItem extends ActionsHubTreeItem {
    constructor() {
        const hasResults = MetadataDiffContext.isActive;

        super(
            Constants.Strings.METADATA_DIFF_GROUP,
            hasResults ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
            Constants.Icons.METADATA_DIFF_GROUP,
            hasResults ? Constants.ContextValues.METADATA_DIFF_GROUP_WITH_RESULTS : Constants.ContextValues.METADATA_DIFF_GROUP,
            undefined
        );

        // Set unique id that changes based on state to ensure VS Code respects our collapsibleState
        // Without this, VS Code may cache the collapsed state from when there were no results
        this.id = hasResults ? "metadataDiffGroup-withResults" : "metadataDiffGroup-noResults";
    }

    public getChildren(): ActionsHubTreeItem[] {
        const siteResults = MetadataDiffContext.allSiteResults;

        if (siteResults.length === 0) {
            return [];
        }

        // Create a site tree item for each site's comparison results
        return siteResults.map(siteResult =>
            new MetadataDiffSiteTreeItem(siteResult.comparisonResults, siteResult.siteName, siteResult.localSiteName, siteResult.environmentName)
        );
    }
}
