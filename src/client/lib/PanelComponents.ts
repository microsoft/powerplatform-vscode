/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { AuthProfileListing, OrgListOutput, PacOutputWithResultList, PacOrgListOutput, PacSolutionListOutput, SolutionListing } from '../pac/PacTypes';

export class PacFlatDataView<PacResultType, TreeType extends vscode.TreeItem> implements vscode.TreeDataProvider<TreeType> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeType | undefined | void> = new vscode.EventEmitter<TreeType | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeType | undefined | void> = this._onDidChangeTreeData.event;

    constructor(
        public readonly dataSource: () => Promise<PacOutputWithResultList<PacResultType>>,
        private readonly mapToTreeItem: (item: PacResultType) => TreeType,
        private readonly itemFilter?: (item:PacResultType) => boolean,
        private readonly watchPath?: vscode.RelativePattern) {

        if (this.watchPath) {
            const watcher = vscode.workspace.createFileSystemWatcher(this.watchPath);
            watcher.onDidChange(() => this.refresh());
            watcher.onDidCreate(() => this.refresh());
            watcher.onDidDelete(() => this.refresh());
        }
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
        } else if (profile.Kind === "ADMIN" || profile.Kind === "UNIVERSAL") {
            return `${profile.Kind}: ${profile.User}`;
        } else {
            return `${profile.Kind}: ${profile.Resource}`;
        }
    }
    private static createTooltip(profile: AuthProfileListing): string {
        const tooltip = [
            vscode.l10n.t({
                message: "Profile Kind: {0}",
                args: [profile.Kind],
                comment: ["The {0} represents the profile type (Admin vs Dataverse)"]})
        ];
        if (profile.Name) {
            tooltip.push(vscode.l10n.t({
                message: "Name: {0}",
                args: [profile.Name],
                comment: ["The {0} represents the optional name the user provided for the profile)"]}));
        }
        if ((profile.Kind === "DATAVERSE" || profile.Kind === "UNIVERSAL") && profile.Resource) {
            tooltip.push(vscode.l10n.t({
                message: "Resource: {0}",
                args: [profile.Resource],
                comment: ["The {0} represents profile's resource/environment URL"]}));
        }
        tooltip.push(vscode.l10n.t({
            message: "User: {0}",
            args: [profile.User],
            comment: ["The {0} represents auth profile's user name (email address))"]}));
        if (profile.CloudInstance) {
            tooltip.push(vscode.l10n.t({
                message: "Cloud Instance: {0}",
                args: [profile.CloudInstance],
                comment: ["The {0} represents profile's Azure Cloud Instances"]}));
        }
        return tooltip.join('\n');
    }
}

export class EnvOrSolutionTreeItem extends vscode.TreeItem {
    constructor(public readonly model: OrgListOutput | SolutionListing){
        super(EnvOrSolutionTreeItem.createLabel(model), EnvOrSolutionTreeItem.setCollapsibleState(model));
        if ("SolutionUniqueName" in model) {
            this.contextValue = "SOLUTION";
            this.tooltip = vscode.l10n.t(
                {
                    message: "Display Name: {0}\nUnique Name: {1}\nVersion: {2}",
                    args: [model.FriendlyName, model.SolutionUniqueName, model.VersionNumber],
                    comment: [
                        "This is a multi-line tooltip",
                        "The {0} represents Solution's Friendly / Display name",
                        "The {1} represents Solution's unique name",
                        "The {2} represents Solution's Version number"
                    ]
                }
            );
        } else {
            this.contextValue = "ENVIRONMENT";
            this.tooltip = vscode.l10n.t(
                {
                    message: "Name: {0}\nURL: {1}\nEnvironment ID: {2}\nOrganization ID: {3}",
                    args: [model.FriendlyName, model.EnvironmentUrl, model.EnvironmentId, model.OrganizationId],
                    comment: [
                        "This is a multi-line tooltip",
                        "The {0} represents Dataverse Environment's Friendly / Display name",
                        "The {1} represents Dataverse Environment's URL",
                        "The {2} represents Dataverse Environment's Environment ID (GUID)",
                        "The {3} represents Dataverse Environment's Organization ID (GUID)"
                    ]
                }
            );
        }
    }

    private static createLabel(model: OrgListOutput | SolutionListing): string {
        if ("SolutionUniqueName" in model){
            return `${model.FriendlyName}, Version: ${model.VersionNumber}`;
        } else {
            return `${model.FriendlyName}`
        }
    }

    private static setCollapsibleState(model: OrgListOutput | SolutionListing): vscode.TreeItemCollapsibleState {
        if ("SolutionUniqueName" in model){
            return vscode.TreeItemCollapsibleState.None;
        }
        return vscode.TreeItemCollapsibleState.Collapsed;
    }
}

export class EnvAndSolutionTreeView implements vscode.TreeDataProvider<EnvOrSolutionTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<EnvOrSolutionTreeItem | undefined | void> = new vscode.EventEmitter<EnvOrSolutionTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<EnvOrSolutionTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(
        public readonly envDataSource: () => Promise<PacOrgListOutput>,
        public readonly solutionDataSource: (environmentUrl: string) => Promise<PacSolutionListOutput>,
    ){
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: EnvOrSolutionTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public async getChildren(element?: EnvOrSolutionTreeItem): Promise<EnvOrSolutionTreeItem[]> {
        if (!element) {
            // root
            const envOutput = await this.envDataSource();
            if (envOutput && envOutput.Status === "Success" && envOutput.Results) {
                return envOutput.Results.map(item => new EnvOrSolutionTreeItem(item))
            } else {
                return [];
            }
        } else if ("SolutionUniqueName" in element.model) {
            // element is solution
            return [];
        } else {
            // element is environment
            const solutionOutput = await this.solutionDataSource(element.model.EnvironmentUrl);
            if (solutionOutput && solutionOutput.Status === "Success" && solutionOutput.Results) {
                return solutionOutput.Results.map(item => new EnvOrSolutionTreeItem(item))
            } else {
                return [];
            }
        }
    }
}
