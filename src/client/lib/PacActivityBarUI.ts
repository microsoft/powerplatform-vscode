// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

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
            const confirm = localize("pacCLI.authPanel.clearAuthProfile.confirm", "Confirm");
            const confirmResult = await vscode.window.showWarningMessage(
                localize("pacCLI.authPanel.clearAuthProfile.prompt", "Are you sure you want to clear all the Auth Profiles?"),
                confirm,
                localize("pacCLI.authPanel.clearAuthProfile.cancel","Cancel"));
            if (confirmResult && confirmResult === confirm) {
                await pacWrapper.authClear();
                authPanel.refresh();
                envAndSolutionPanel.refresh();
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
                envAndSolutionPanel.refresh();
            }
        }),
        vscode.commands.registerCommand("pacCLI.authPanel.selectAuthProfile", async (item: AuthProfileTreeItem) => {
            await pacWrapper.authSelectByIndex(item.model.Index);
            authPanel.refresh();
            envAndSolutionPanel.refresh();
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
                envAndSolutionPanel.refresh();
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
