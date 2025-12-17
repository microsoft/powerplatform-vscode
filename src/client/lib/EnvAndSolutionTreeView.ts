/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { OrgListOutput, PacOrgListOutput, PacSolutionListOutput, SolutionListing } from '../pac/PacTypes';
import { PacWrapper } from '../pac/PacWrapper';

export class EnvAndSolutionTreeView implements vscode.TreeDataProvider<EnvOrSolutionTreeItem>, vscode.Disposable {
    private readonly _disposables: vscode.Disposable[] = [];
    private _refreshTimeout?: NodeJS.Timeout;
    private _onDidChangeTreeData: vscode.EventEmitter<EnvOrSolutionTreeItem | undefined | void> = new vscode.EventEmitter<EnvOrSolutionTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<EnvOrSolutionTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(
        public readonly envDataSource: () => Promise<PacOrgListOutput>,
        public readonly solutionDataSource: (environmentUrl: string) => Promise<PacSolutionListOutput>,
        authChanged: vscode.Event<unknown>,
        pacWrapper: PacWrapper){

        this._disposables.push(...this.registerPanel(pacWrapper),
            authChanged(() => this.refresh()));
    }

    dispose() {
        this._disposables.forEach(d => d.dispose());
    }

    // Some actions like OrgSelect cause changes to the AuthProfile file, which the
    // AuthPanelView is watching.  When the AuthPanel refreshes, this panel also
    // refreshes via the authChanged event passed in at construction time.
    // However, the OS can prevent or limit the number of available file watches, so
    // use a backup refresh on a 200ms delay to ensure the panel is refreshed.
    private delayRefresh(): void {
        if (!this._refreshTimeout) {
            this._refreshTimeout = setTimeout(() => this.refresh(), 200);
        }
    }

    refresh(): void {
        if (this._refreshTimeout) {
            clearTimeout(this._refreshTimeout);
            this._refreshTimeout = undefined;
        }
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

    private registerPanel(pacWrapper: PacWrapper): vscode.Disposable[] {
        return [
            vscode.window.registerTreeDataProvider("pacCLI.envAndSolutionsPanel", this),
            vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.refresh", () => this.refresh()),
            vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.copyDisplayName", (item: EnvOrSolutionTreeItem) => {
                vscode.env.clipboard.writeText((item.model as OrgListOutput).FriendlyName);
            }),
            vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.copyEnvironmentId", (item: EnvOrSolutionTreeItem) => {
                vscode.env.clipboard.writeText((item.model as OrgListOutput).EnvironmentIdentifier.Id);
            }),
            vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.copyEnvironmentUrl", (item: EnvOrSolutionTreeItem) => {
                vscode.env.clipboard.writeText((item.model as OrgListOutput).EnvironmentUrl);
            }),
            vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.selectEnvironment", async (item: EnvOrSolutionTreeItem) => {
                await pacWrapper.orgSelect((item.model as OrgListOutput).EnvironmentUrl);
                this.delayRefresh();
            }),
            vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.copyOrganizationId", (item: EnvOrSolutionTreeItem) => {
                vscode.env.clipboard.writeText((item.model as OrgListOutput).OrganizationId);
            }),
            vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.copyFriendlyName", (item: EnvOrSolutionTreeItem) => {
                vscode.env.clipboard.writeText((item.model as SolutionListing).FriendlyName);
            }),
            vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.copyUniqueName", (item: EnvOrSolutionTreeItem) => {
                vscode.env.clipboard.writeText((item.model as SolutionListing).SolutionUniqueName);
            }),
            vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.copyVersionNumber", (item: EnvOrSolutionTreeItem) => {
                vscode.env.clipboard.writeText((item.model as SolutionListing).VersionNumber);
            })
        ];
    }
}

class EnvOrSolutionTreeItem extends vscode.TreeItem {
    constructor(public readonly model: OrgListOutput | SolutionListing){
        super(EnvOrSolutionTreeItem.createLabel(model), EnvOrSolutionTreeItem.setCollapsibleState(model));
        if ("SolutionUniqueName" in model) {
            this.contextValue = "SOLUTION";
            const solutionType = model.IsManaged
                ? vscode.l10n.t("Managed")
                : vscode.l10n.t("Unmanaged");
            this.tooltip = vscode.l10n.t(
                {
                    message: "Display Name: {0}\nUnique Name: {1}\nVersion: {2}\nType: {3}",
                    args: [model.FriendlyName, model.SolutionUniqueName, model.VersionNumber, solutionType],
                    comment: [
                        "This is a multi-line tooltip",
                        "The {0} represents Solution's Friendly / Display name",
                        "The {1} represents Solution's unique name",
                        "The {2} represents Solution's Version number",
                        "The {3} represents Solution's Type (Managed or Unmanaged), but that test is localized separately."
                    ]
                }
            );
            if (model.IsManaged) {
                this.iconPath = new vscode.ThemeIcon("lock");
            }
        } else {
            this.contextValue = "ENVIRONMENT";
            this.tooltip = vscode.l10n.t(
                {
                    message: "Name: {0}\nURL: {1}\nEnvironment ID: {2}\nOrganization ID: {3}",
                    args: [model.FriendlyName, model.EnvironmentUrl, model.EnvironmentIdentifier.Id, model.OrganizationId],
                    comment: [
                        "This is a multi-line tooltip",
                        "The {0} represents Dataverse Environment's Friendly / Display name",
                        "The {1} represents Dataverse Environment's URL",
                        "The {2} represents Dataverse Environment's Environment ID (GUID)",
                        "The {3} represents Dataverse Environment's Organization ID (GUID)"
                    ]
                }
            );
            if (model.IsActive) {
                this.iconPath = new vscode.ThemeIcon("star-full");
            }
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
