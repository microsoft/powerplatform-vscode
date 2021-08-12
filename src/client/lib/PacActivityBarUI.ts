// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { AdminEnvironmentListing, AuthProfileListing, SolutionListing, PacOutputWithResultList } from '../pac/PacTypes';
import { PacWrapper } from '../pac/PacWrapper';

export function RegisterPanels(pacWrapper: PacWrapper): vscode.Disposable[] {
    const registrations: vscode.Disposable[] = [];

    const solutionPanel = new PacFlatDataView(() => pacWrapper.solutionList(), item => new SolutionTreeItem(item));
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.solutionPanel", solutionPanel),
        vscode.commands.registerCommand("pacCLI.solutionPanel.refresh", () => solutionPanel.refresh()));

    const adminEnvironmentPanel = new PacFlatDataView(
        () => pacWrapper.adminEnvironmentList(),
        item => new AdminEnvironmentTreeItem(item));
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.adminEnvironmentPanel", adminEnvironmentPanel),
        vscode.commands.registerCommand("pacCLI.adminEnvironmentPanel.refresh", () => adminEnvironmentPanel.refresh()));

    const authPanel = new PacFlatDataView(
        () => pacWrapper.authList(),
        item => new AuthProfileTreeItem(item));
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.authPanel", authPanel),
        vscode.commands.registerCommand("pacCLI.authPanel.refresh", () => authPanel.refresh()),
        vscode.commands.registerCommand("pacCLI.authPanel.newDataverseAuthProfile", async () => {
            const environmentUrl = await vscode.window.showInputBox({
                title: "Create new Dataverse Auth Profile",
                prompt: "Enter Environment URL",
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
            const confirmResult = await vscode.window.showWarningMessage(`Are you sure you want to delete the Auth Profile ${item.model.User}-${item.model.Resource}?`,"Confirm","Cancel");
            if (confirmResult && confirmResult === "Confirm") {
                await pacWrapper.authDeleteByIndex(item.model.Index);
                authPanel.refresh();
                if (item.model.Kind === "DATAVERSE") {
                    solutionPanel.refresh();
                } else if (item.model.Kind === "ADMIN") {
                    adminEnvironmentPanel.refresh();
                }
            }
        }));

    return registrations;
}

class PacFlatDataView<PacResultType, TreeType extends vscode.TreeItem> implements vscode.TreeDataProvider<TreeType> {
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

class AuthProfileTreeItem extends vscode.TreeItem {
    public constructor(public readonly model: AuthProfileListing) {
        super(AuthProfileTreeItem.createLabel(model), vscode.TreeItemCollapsibleState.None);
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
            return `${profile.Kind}: ${profile.User} - ${profile.Resource}`;
        }
    }
}
class SolutionTreeItem extends vscode.TreeItem {
    public constructor(public readonly model: SolutionListing) {
        super(`${model.FriendlyName}, Version: ${model.VersionNumber}`);
    }
}

class AdminEnvironmentTreeItem extends vscode.TreeItem {
    public constructor(public readonly model: AdminEnvironmentListing) {
        super(`${model.DisplayName} ${model.EnvironmentUrl}`);
    }
}
