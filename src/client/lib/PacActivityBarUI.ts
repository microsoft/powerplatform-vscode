// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

import * as vscode from 'vscode';
import { OrgListOutput, PacOrgListOutput, PacSolutionListOutput, SolutionListing } from '../pac/PacTypes';
import { PacWrapper } from '../pac/PacWrapper';
import { PacFlatDataView, SolutionTreeItem, AdminEnvironmentTreeItem, AuthProfileTreeItem } from './PanelComponents';

export function RegisterPanels(pacWrapper: PacWrapper): vscode.Disposable[] {
    const registrations: vscode.Disposable[] = [];

    const solutionPanel = new PacFlatDataView(() => pacWrapper.solutionList(), item => new SolutionTreeItem(item));
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.solutionPanel", solutionPanel),
        vscode.commands.registerCommand("pacCLI.solutionPanel.refresh", () => solutionPanel.refresh()),
        vscode.commands.registerCommand("pacCLI.solutionPanel.copyFriendlyName", (item: SolutionTreeItem) => {
            vscode.env.clipboard.writeText(item.model.FriendlyName);
        }),
        vscode.commands.registerCommand("pacCLI.solutionPanel.copyVersionNumber", (item: SolutionTreeItem) => {
            vscode.env.clipboard.writeText(item.model.VersionNumber);
        }));

    const adminEnvironmentPanel = new PacFlatDataView(
        () => pacWrapper.adminEnvironmentList(),
        item => new AdminEnvironmentTreeItem(item));
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.adminEnvironmentPanel", adminEnvironmentPanel),
        vscode.commands.registerCommand("pacCLI.adminEnvironmentPanel.refresh", () => adminEnvironmentPanel.refresh()),
        vscode.commands.registerCommand("pacCLI.adminEnvironmentPanel.copyDisplayName", (item: AdminEnvironmentTreeItem) => {
            vscode.env.clipboard.writeText(item.model.DisplayName);
        }),
        vscode.commands.registerCommand("pacCLI.adminEnvironmentPanel.copyEnvironmentId", (item: AdminEnvironmentTreeItem) => {
            vscode.env.clipboard.writeText(item.model.EnvironmentId);
        }),
        vscode.commands.registerCommand("pacCLI.adminEnvironmentPanel.copyEnvironmentUrl", (item: AdminEnvironmentTreeItem) => {
            vscode.env.clipboard.writeText(item.model.EnvironmentUrl);
        }),
        vscode.commands.registerCommand("pacCLI.adminEnvironmentPanel.copyOrganizationId", (item: AdminEnvironmentTreeItem) => {
            vscode.env.clipboard.writeText(item.model.OrganizationId);
        }));

    const authPanel = new PacFlatDataView(
        () => pacWrapper.authList(),
        item => new AuthProfileTreeItem(item));
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.authPanel", authPanel),
        vscode.commands.registerCommand("pacCLI.authPanel.refresh", () => authPanel.refresh()),
        vscode.commands.registerCommand("pacCLI.authPanel.clearAuthProfile", async () => {
            const confirm = localize("pacCLI.authPanel.clearAuthProfile.confirm", "Confirm");
            const confirmResult = await vscode.window.showWarningMessage(
                localize("pacCLI.authPanel.clearAuthProfile.prompt", "Are you sure you want to clear all the Auth Profiles?"),
                confirm,
                localize("pacCLI.authPanel.clearAuthProfile.cancel","Cancel"));
            if (confirmResult && confirmResult === confirm) {
                await pacWrapper.authClear();
                authPanel.refresh();
                solutionPanel.refresh();
                adminEnvironmentPanel.refresh();
            }
        }),
        vscode.commands.registerCommand("pacCLI.authPanel.newDataverseAuthProfile", async () => {
            const environmentUrl = await vscode.window.showInputBox({
                title: localize("pacCLI.authPanel.newDataverseAuthProfile.title", "Create new Dataverse Auth Profile"),
                prompt: localize("pacCLI.authPanel.newDataverseAuthProfile.prompt", "Enter Environment URL"),
                placeHolder: "https://example.crm.dynamics.com/"
            });
            if (environmentUrl) {
                await pacWrapper.authCreateNewDataverseProfile(environmentUrl);
                authPanel.refresh();
                solutionPanel.refresh();
            }
        }),
        vscode.commands.registerCommand("pacCLI.authPanel.newAdminAuthProfile", async () => {
            await pacWrapper.authCreateNewAdminProfile();
            authPanel.refresh();
            adminEnvironmentPanel.refresh();
        }),
        vscode.commands.registerCommand("pacCLI.authPanel.selectAuthProfile", async (item: AuthProfileTreeItem) => {
            await pacWrapper.authSelectByIndex(item.model.Index);
            authPanel.refresh();
            if (item.model.Kind === "DATAVERSE") {
                solutionPanel.refresh();
            } else if (item.model.Kind === "ADMIN") {
                adminEnvironmentPanel.refresh();
            }
        }),
        vscode.commands.registerCommand("pacCLI.authPanel.deleteAuthProfile", async (item: AuthProfileTreeItem) => {
            const confirm = localize("pacCLI.authPanel.deleteAuthProfile.confirm", "Confirm");
            const confirmResult = await vscode.window.showWarningMessage(
                localize({ key: "pacCLI.authPanel.deleteAuthProfile.prompt",
                    comment: ["{0} is the user name, {1} is the URL of environment of the auth profile"]},
                    "Are you sure you want to delete the Auth Profile {0}-{1}?",
                    item.model.User,
                    item.model.Resource),
                confirm,
                localize("pacCLI.authPanel.deleteAuthProfile.cancel", "Cancel"));
            if (confirmResult && confirmResult === confirm) {
                await pacWrapper.authDeleteByIndex(item.model.Index);
                authPanel.refresh();
                if (item.model.Kind === "DATAVERSE") {
                    solutionPanel.refresh();
                } else if (item.model.Kind === "ADMIN") {
                    adminEnvironmentPanel.refresh();
                }
            }
        }),
        vscode.commands.registerCommand('pacCLI.authPanel.nameAuthProfile', async (item: AuthProfileTreeItem) => {
            const authProfileName = await vscode.window.showInputBox({
                title: localize("pacCLI.authPanel.nameAuthProfile.title", "Name/Rename Auth Profile"),
                prompt: localize("pacCLI.authPanel.nameAuthProfile.prompt", "The name you want to give to this authentication profile"),
                validateInput: value => value.length <= 12 ? null : localize("pacCLI.authPanel.nameAuthProfile.validation", 'Maximum 12 characters allowed')
            });
            if (authProfileName) {
                await pacWrapper.authNameByIndex(item.model.Index, authProfileName);
                authPanel.refresh();
            }
        }),
        vscode.commands.registerCommand('pacCLI.authPanel.navigateToResource', (item: AuthProfileTreeItem) => {
            vscode.env.openExternal(vscode.Uri.parse(item.model.Resource));
        }),
        vscode.commands.registerCommand('pacCLI.authPanel.copyUser', (item: AuthProfileTreeItem) => {
            vscode.env.clipboard.writeText(item.model.User);
        }));

    const envAndSolutionPanel = new EnvAndSolutionTreeView(
        () => pacWrapper.orgList(),
        (envId) => pacWrapper.solutionListFromEnvironment(envId));
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.envAndSolutionsPanel", envAndSolutionPanel));

    return registrations;
}

class EnvOrSolutionTreeItem extends vscode.TreeItem {
    constructor(public readonly model: OrgListOutput | SolutionListing){
        super(EnvOrSolutionTreeItem.createLabel(model), EnvOrSolutionTreeItem.setCollapsibleState(model));
        this.tooltip = ("SolutionUniqueName" in model)
            ? `Display Name: ${model.FriendlyName}\nUnique Name: ${model.SolutionUniqueName}\nVersion: ${model.VersionNumber}`
            : `Name: ${model.FriendlyName}\nURL: ${model.EnvironmentUrl}\nEnvironment ID: ${model.EnvironmentId}\nOrganization ID: ${model.OrganizationId}`
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

class EnvAndSolutionTreeView implements vscode.TreeDataProvider<EnvOrSolutionTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<EnvOrSolutionTreeItem | undefined | void> = new vscode.EventEmitter<EnvOrSolutionTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<EnvOrSolutionTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(
        public readonly envDataSource: () => Promise<PacOrgListOutput>,
        public readonly solutionDataSource: (envId: string) => Promise<PacSolutionListOutput>,
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
            const solutionOutput = await this.solutionDataSource(element.model.EnvironmentId);
            if (solutionOutput && solutionOutput.Status === "Success" && solutionOutput.Results) {
                return solutionOutput.Results.map(item => new EnvOrSolutionTreeItem(item))
            } else {
                return [];
            }
        }
    }
}
