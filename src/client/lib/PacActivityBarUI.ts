// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
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
        }),
        vscode.commands.registerCommand('pacCLI.authPanel.navigateToResource', (item: AuthProfileTreeItem) => {
            vscode.env.openExternal(vscode.Uri.parse(item.model.Resource));
        }),
        vscode.commands.registerCommand('pacCLI.authPanel.copyUser', (item: AuthProfileTreeItem) => {
            vscode.env.clipboard.writeText(item.model.User);
        }));

    return registrations;
}
