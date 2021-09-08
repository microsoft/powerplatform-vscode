// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { AdminEnvironmentListing, AuthProfileListing, SolutionListing, PacOutputWithResultList } from '../pac/PacTypes';

export class PacFlatDataView<PacResultType, TreeType extends vscode.TreeItem> implements vscode.TreeDataProvider<TreeType> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeType | undefined | void> = new vscode.EventEmitter<TreeType | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeType | undefined | void> = this._onDidChangeTreeData.event;

    constructor(
        public readonly dataSource: () => Promise<PacOutputWithResultList<PacResultType>>,
        private readonly mapToTreeItem: (item: PacResultType) => TreeType,
        private readonly itemFilter?: (item:PacResultType) => boolean) {
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: TreeType): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public async getChildren(element?: TreeType): Promise<TreeType[]> {
        if (element) {
            // If we are not at the root, then there are no child items
            return [];
        } else {
            const pacOutput = await this.dataSource();
            if (pacOutput && pacOutput.Status === "Success" && pacOutput.Results) {
                const items = pacOutput.Results
                    .filter(this.itemFilter || (_ => true))
                    .map(this.mapToTreeItem);
                return items;
            } else {
                return [];
            }
        }
    }
}

export class AuthProfileTreeItem extends vscode.TreeItem {
    public constructor(public readonly model: AuthProfileListing) {
        super(AuthProfileTreeItem.createLabel(model), vscode.TreeItemCollapsibleState.None);
        this.contextValue = model.Kind;
        this.tooltip = AuthProfileTreeItem.createTooltip(model);
        if (model.IsActive){
            this.iconPath = new vscode.ThemeIcon("star-full")
        }
    }
    private static createLabel(profile: AuthProfileListing): string {
        if (profile.Name) {
            return `${profile.Kind}: ${profile.Name}`;
        } else if (profile.Kind === "ADMIN") {
            return `${profile.Kind}: ${profile.User}`;
        } else {
            return `${profile.Kind}: ${profile.Resource}`;
        }
    }
    private static createTooltip(profile: AuthProfileListing): string {
        let tooltip = `Profile Kind: ${profile.Kind}: `;
        if (profile.Name) {
            tooltip += `\nName: ${profile.Name} `;
        }
        if (profile.Kind === "DATAVERSE") {
            tooltip += `\nResource: ${profile.Resource} `;
        }
        tooltip += `\nUser: ${profile.User}`;
        return tooltip;
    }
}

export class SolutionTreeItem extends vscode.TreeItem {
    public constructor(public readonly model: SolutionListing) {
        super(`${model.FriendlyName}, Version: ${model.VersionNumber}`);

        this.tooltip = `Display Name: ${model.FriendlyName}\nUnique Name: ${model.SolutionUniqueName}\nVersion: ${model.VersionNumber}`
    }
}

export class AdminEnvironmentTreeItem extends vscode.TreeItem {
    public constructor(public readonly model: AdminEnvironmentListing) {
        super(model.DisplayName);

        this.tooltip = `Name: ${model.DisplayName}\nType: ${model.Type}\nURL: ${model.EnvironmentUrl}\nEnvironment ID: ${model.EnvironmentId}\nOrganization ID: ${model.OrganizationId}`
    }
}
