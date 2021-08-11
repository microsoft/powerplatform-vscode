// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { AdminEnvironmentListing, AuthProfileListing, SolutionListing, PacOutputWithResultList } from '../pac/PacTypes';
import { PacWrapper } from '../pac/PacWrapper';

export function RegisterPanels(pacWrapper: PacWrapper): vscode.Disposable[] {
    const registrations: vscode.Disposable[] = [];

    const dataverseAuthPanel = new PacFlatDataView(
        () => pacWrapper.authList(),
        item => new AuthProfileTreeItem(item),
        item => item.Kind === "CDS" || item.Kind === "DATAVERSE");
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.dataverseAuthPanel", dataverseAuthPanel),
        vscode.commands.registerCommand("pacCLI.dataverseAuthPanel.refresh", () => dataverseAuthPanel.refresh()));

    const solutionPanel = new PacFlatDataView(() => pacWrapper.solutionList(), item => new SolutionTreeItem(item));
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.solutionPanel", solutionPanel),
        vscode.commands.registerCommand("pacCLI.solutionPanel.refresh", () => solutionPanel.refresh()));

    const adminAuthPanel = new PacFlatDataView(
        () => pacWrapper.authList(),
        item => new AuthProfileTreeItem(item),
        item => item.Kind === "ADMIN");
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.adminAuthPanel",adminAuthPanel),
        vscode.commands.registerCommand("pacCLI.adminAuthPanel.refresh", () => adminAuthPanel.refresh()));

    const adminEnvironmentPanel = new PacFlatDataView(
        () => pacWrapper.adminEnvironmentList(),
        item => new AdminEnvironmentTreeItem(item));
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.adminEnvironmentPanel", adminEnvironmentPanel),
        vscode.commands.registerCommand("pacCLI.adminEnvironmentPanel.refresh", () => adminEnvironmentPanel.refresh()));

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
            if (pacOutput && pacOutput.Status === "Success") {
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
    public constructor(private readonly model: AuthProfileListing) {
        super(`${model.Resource} - ${model.User}`, vscode.TreeItemCollapsibleState.None);
        if (model.IsActive){
            this.iconPath = new vscode.ThemeIcon("star-full")
        }
    }
}
class SolutionTreeItem extends vscode.TreeItem {
    public constructor(private readonly model: SolutionListing) {
        super(`${model.FriendlyName}-${model.VersionNumber}`);
    }
}

class AdminEnvironmentTreeItem extends vscode.TreeItem {
    public constructor(private readonly model: AdminEnvironmentListing) {
        super(`${model.DisplayName} ${model.EnvironmentUrl}`);
    }
}
