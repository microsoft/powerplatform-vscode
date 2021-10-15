// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

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
        const tooltip = [
            localize({
                key: "pacCLI.AuthProfileTreeItem.toolTipParts.profileKind",
                comment: ["The {0} represents the profile type (Admin vs Dataverse)"]},
                "Profile Kind: {0}",
                profile.Kind)
        ];
        if (profile.Name) {
            tooltip.push(localize({
                key: "pacCLI.AuthProfileTreeItem.toolTipParts.profileName",
                comment: ["The {0} represents the optional name the user provided for the profile)"]},
                "Name: {0}",
                profile.Name));
        }
        if (profile.Kind === "DATAVERSE") {
            tooltip.push(localize({
                key: "pacCLI.AuthProfileTreeItem.toolTipParts.resource",
                comment: ["The {0} represents profile's resource/environment URL"]},
                "Resource: {0}",
                profile.Resource));
        }
        tooltip.push(localize({
            key: "pacCLI.AuthProfileTreeItem.toolTipParts.user",
            comment: ["The {0} represents auth profile's user name (email address))"]},
            "User: {0}",
            profile.User));
        return tooltip.join('\n');
    }
}

export class SolutionTreeItem extends vscode.TreeItem {
    public constructor(public readonly model: SolutionListing) {
        super(localize({
            key: "pacCLI.SolutionTreeItem.label",
            comment: [
                "The {0} represents Solution's Friendly / Display name",
                "The {1} represents Solution's Version number"]},
            "{0}, Version: {1}",
            model.FriendlyName,
            model.VersionNumber));

        this.tooltip = localize({
            key: "pacCLI.SolutionTreeItem.toolTip",
            comment: [
                "This is a multi-line tooltip",
                "The {0} represents Solution's Friendly / Display name",
                "The {1} represents Solution's unique name",
                "The {2} represents Solution's Version number"]},
            "Display Name: {0}\nUnique Name: {1}\nVersion: {2}",
            model.FriendlyName,
            model.SolutionUniqueName,
            model.VersionNumber);
    }
}

export class AdminEnvironmentTreeItem extends vscode.TreeItem {
    public constructor(public readonly model: AdminEnvironmentListing) {
        super(model.DisplayName);

        this.tooltip = localize({
            key: "pacCLI.AdminEnvironmentTreeItem.toolTip",
            comment: [
                "This is a multi-line tooltip",
                "The {0} represents Dataverse Environment's Friendly / Display name",
                "The {1} represents Dataverse Environment's type (Default, Sandbox, Trial, etc)",
                "The {2} represents Dataverse Environment's URL",
                "The {3} represents Dataverse Environment's Environment ID (GUID)",
                "The {4} represents Dataverse Environment's Organization ID (GUID)"]},
            "Name: {0}\nType: {1}\nURL: {2}\nEnvironment ID: {3}\nOrganization ID: {4}",
            model.DisplayName,
            model.Type,
            model.EnvironmentUrl,
            model.EnvironmentId,
            model.OrganizationId);
    }
}
