/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "../ActionsHubTreeItem";
import { Constants } from "../../Constants";
import { resolveSiteFromWorkspace } from "../../handlers/metadata-diff/MetadataDiffUtils";
import { MetadataDiffWelcomeNoSiteTreeItem } from "./MetadataDiffWelcomeNoSiteTreeItem";
import { MetadataDiffWelcomeCTATreeItem } from "./MetadataDiffWelcomeCTATreeItem";

/**
 * Checks if a Power Pages site is available in the current workspace
 * @returns True if a site is detected, false otherwise
 */
export function detectSiteInWorkspace(): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        return false;
    }

    // Check the first workspace folder for a Power Pages site
    const siteResolution = resolveSiteFromWorkspace(workspaceFolders[0].uri.fsPath);
    return siteResolution !== undefined;
}

/**
 * Welcome tree item shown in the Site Comparison group when no comparisons are active.
 * Shows the main description text with a child item based on workspace state.
 */
export class MetadataDiffWelcomeTreeItem extends ActionsHubTreeItem {
    private readonly _hasSiteInWorkspace: boolean;

    constructor() {
        const hasSite = detectSiteInWorkspace();

        super(
            Constants.Strings.METADATA_DIFF_WELCOME_DESCRIPTION,
            vscode.TreeItemCollapsibleState.Expanded,
            "",
            Constants.ContextValues.METADATA_DIFF_WELCOME_DESCRIPTION,
            ""
        );

        this._hasSiteInWorkspace = hasSite;
        this.id = "metadataDiffWelcome";
    }

    /**
     * Whether a Power Pages site was detected in the workspace
     */
    public get hasSiteInWorkspace(): boolean {
        return this._hasSiteInWorkspace;
    }

    public getChildren(): ActionsHubTreeItem[] {
        if (this._hasSiteInWorkspace) {
            return [new MetadataDiffWelcomeCTATreeItem()];
        } else {
            return [new MetadataDiffWelcomeNoSiteTreeItem()];
        }
    }
}
