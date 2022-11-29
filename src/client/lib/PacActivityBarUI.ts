/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { OrgListOutput, SolutionListing } from '../pac/PacTypes';
import { PacWrapper } from '../pac/PacWrapper';
import { AuthProfileTreeItem, EnvAndSolutionTreeView, EnvOrSolutionTreeItem, PacFlatDataView } from './PanelComponents';

export function RegisterPanels(pacWrapper: PacWrapper): vscode.Disposable[] {
    const registrations: vscode.Disposable[] = [];

    const authPanel = new PacFlatDataView(
        () => pacWrapper.authList(),
        item => new AuthProfileTreeItem(item),
        item => item.Kind !== "ADMIN");
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.authPanel", authPanel),
        vscode.commands.registerCommand("pacCLI.authPanel.refresh", () => authPanel.refresh()),
        vscode.commands.registerCommand("pacCLI.authPanel.clearAuthProfile", async () => {
            const confirm = vscode.l10n.t("Confirm");
            const confirmResult = await vscode.window.showWarningMessage(
                vscode.l10n.t("Are you sure you want to clear all the Auth Profiles? TEST"),
                confirm,
                vscode.l10n.t("Cancel"));
            if (confirmResult && confirmResult === confirm) {
                await pacWrapper.authClear();
                authPanel.refresh();
                envAndSolutionPanel.refresh();
            }
        }),
        vscode.commands.registerCommand("pacCLI.authPanel.newAuthProfile", async () => {
            await pacWrapper.authCreateNewAuthProfile();
            authPanel.refresh();
            envAndSolutionPanel.refresh();
        }),
        vscode.commands.registerCommand("pacCLI.authPanel.selectAuthProfile", async (item: AuthProfileTreeItem) => {
            await pacWrapper.authSelectByIndex(item.model.Index);
            authPanel.refresh();
            envAndSolutionPanel.refresh();
        }),
        vscode.commands.registerCommand("pacCLI.authPanel.deleteAuthProfile", async (item: AuthProfileTreeItem) => {
            const confirm = vscode.l10n.t("Confirm");
            const confirmResult = await vscode.window.showWarningMessage(
                vscode.l10n.t({ message: "Are you sure you want to delete the Auth Profile {0}-{1}?",
                    args: [item.model.User, item.model.Resource],
                    comment: ["{0} is the user name, {1} is the URL of environment of the auth profile"] }),
                confirm,
                vscode.l10n.t("Cancel"));
            if (confirmResult && confirmResult === confirm) {
                await pacWrapper.authDeleteByIndex(item.model.Index);
                authPanel.refresh();
                envAndSolutionPanel.refresh();
            }
        }),
        vscode.commands.registerCommand('pacCLI.authPanel.nameAuthProfile', async (item: AuthProfileTreeItem) => {
            const authProfileName = await vscode.window.showInputBox({
                title: vscode.l10n.t("Name/Rename Auth Profile"),
                prompt: vscode.l10n.t("The name you want to give to this authentication profile"),
                validateInput: value => value.length <= 30 ? null : vscode.l10n.t('Maximum 30 characters allowed')
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
        (environmentUrl) => pacWrapper.solutionListFromEnvironment(environmentUrl));
    registrations.push(
        vscode.window.registerTreeDataProvider("pacCLI.envAndSolutionsPanel", envAndSolutionPanel),
        vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.refresh", () => envAndSolutionPanel.refresh()),
        vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.copyDisplayName", (item: EnvOrSolutionTreeItem) => {
            vscode.env.clipboard.writeText((item.model as OrgListOutput).FriendlyName);
        }),
        vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.copyEnvironmentId", (item: EnvOrSolutionTreeItem) => {
            vscode.env.clipboard.writeText((item.model as OrgListOutput).EnvironmentId);
        }),
        vscode.commands.registerCommand("pacCLI.envAndSolutionsPanel.copyEnvironmentUrl", (item: EnvOrSolutionTreeItem) => {
            vscode.env.clipboard.writeText((item.model as OrgListOutput).EnvironmentUrl);
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
        }));

    return registrations;
}
