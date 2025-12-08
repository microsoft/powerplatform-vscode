/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./ActionsHubTreeItem";
import { MetadataDiffTreeDataProvider } from "../../../../common/power-pages/metadata-diff/MetadataDiffTreeDataProvider";
import { MetadataDiffTreeItem } from "../../../../common/power-pages/metadata-diff/tree-items/MetadataDiffTreeItem";
import { MetadataDiffWrapperTreeItem } from "./MetadataDiffWrapperTreeItem";

/**
 * Root group node for Metadata Diff items within the Actions Hub tree.
 */
export class MetadataDiffGroupTreeItem extends ActionsHubTreeItem {
    constructor(private readonly _provider: MetadataDiffTreeDataProvider, hasData: boolean, label: string, websiteName?: string, envName?: string) {
        super(
            label,
            hasData ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed,
            new vscode.ThemeIcon("split-horizontal"),
            "metadataDiffRoot",
            hasData ? "" : vscode.l10n.t("No data yet")
        );
        this.tooltip = hasData && websiteName && envName
            ? vscode.l10n.t("Power Pages metadata comparison: {0} local vs {1}", websiteName, envName)
            : vscode.l10n.t("Power Pages metadata comparison");
    }

    public getChildren(): ActionsHubTreeItem[] {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        // @ts-expect-error Accessing private field for integration wrapper
        if (this._provider._diffItems?.length === 0) {
            this._provider.getChildren();
        }
        // @ts-expect-error Accessing private field for integration wrapper
        const items: MetadataDiffTreeItem[] | null | undefined = this._provider._diffItems || [];
        if (!items || !Array.isArray(items)) {
            return [];
        }
        return items.map(i => new MetadataDiffWrapperTreeItem(i));
    }
}
