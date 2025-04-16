/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as os from 'os';
import path from 'path';
import * as vscode from 'vscode';
import { AuthProfileListing, PacAuthListOutput, } from '../pac/PacTypes';
import { PacWrapper } from '../pac/PacWrapper';

export class AuthTreeView implements vscode.TreeDataProvider<AuthProfileTreeItem>, vscode.Disposable {
    private readonly _disposables: vscode.Disposable[] = [];
    private _refreshTimeout?: NodeJS.Timeout;
    private _onDidChangeTreeData: vscode.EventEmitter<AuthProfileTreeItem | undefined | void> = new vscode.EventEmitter<AuthProfileTreeItem | undefined | void>();
    public readonly onDidChangeTreeData: vscode.Event<AuthProfileTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(
        public readonly dataSource: () => Promise<PacAuthListOutput>,
        pacWrapper: PacWrapper) {

        const watchPath = GetAuthProfileWatchPattern();
        if (watchPath) {
            const watcher = vscode.workspace.createFileSystemWatcher(watchPath);
            this._disposables.push(
                watcher,
                watcher.onDidChange(() => this.delayRefresh()),
                watcher.onDidCreate(() => this.delayRefresh()),
                watcher.onDidDelete(() => this.delayRefresh())
            );
        }

        this._disposables.push(...this.registerPanel(pacWrapper));
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }

    // We refresh the Auth Panel by both the FileWatcher events and by direct invocation
    // after a executing a create/delete/select/etc command via the UI buttons.
    // This can cause doubled refresh (and thus double `pac auth list` and `pac org list` calls).
    // We want both routes, but don't want the double refresh, so use a singleton timeout limit
    // to a single refresh call.
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

    public getTreeItem(element: AuthProfileTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public async getChildren(element?: AuthProfileTreeItem): Promise<AuthProfileTreeItem[]> {
        if (element) {
            // This "Tree" view is a flat list, so return no children when not at the root
            return [];
        }

        vscode.commands.executeCommand('setContext', 'microsoft.powerplatform.authPanel.isInitializing', true);
        try {
            const pacOutput = await this.dataSource();
            if (pacOutput && pacOutput.Status === "Success" && pacOutput.Results) {
                const items = pacOutput.Results
                    .filter(item => item.Kind !== "ADMIN") // Only Universal and Dataverse profiles
                    .map(item => new AuthProfileTreeItem(item));
                return items;
            } else {
                return [];
            }
        } finally {
            vscode.commands.executeCommand('setContext', 'microsoft.powerplatform.authPanel.isInitializing', false);
        }
    }

    private registerPanel(pacWrapper: PacWrapper): vscode.Disposable[] {
        return [
            vscode.window.registerTreeDataProvider("pacCLI.authPanel", this),
            vscode.commands.registerCommand("pacCLI.authPanel.refresh", () => this.refresh()),
            vscode.commands.registerCommand("pacCLI.authPanel.clearAuthProfile", async () => {
                const confirm = vscode.l10n.t("Confirm");
                const confirmResult = await vscode.window.showWarningMessage(
                    vscode.l10n.t("Are you sure you want to clear all the Auth Profiles?"),
                    confirm,
                    vscode.l10n.t("Cancel"));
                if (confirmResult && confirmResult === confirm) {
                    await pacWrapper.authClear();
                    this.delayRefresh();
                }
            }),
            vscode.commands.registerCommand("pacCLI.authPanel.newAuthProfile", async () => {
                await pacWrapper.authCreateNewAuthProfile();
                this.delayRefresh();
            }),
            vscode.commands.registerCommand("pacCLI.authPanel.selectAuthProfile", async (item: AuthProfileTreeItem) => {
                await pacWrapper.authSelectByIndex(item.model.Index);
                this.delayRefresh();
            }),
            vscode.commands.registerCommand("pacCLI.authPanel.deleteAuthProfile", async (item: AuthProfileTreeItem) => {
                const confirm = vscode.l10n.t("Confirm");
                const confirmResult = await vscode.window.showWarningMessage(
                    vscode.l10n.t({ message: "Are you sure you want to delete the Auth Profile {0}-{1}?",
                        args: [item.model.UserDisplayName, item.model.ActiveOrganization?.Item2],
                        comment: ["{0} is the user name, {1} is the URL of environment of the auth profile"] }),
                    confirm,
                    vscode.l10n.t("Cancel"));
                if (confirmResult && confirmResult === confirm) {
                    await pacWrapper.authDeleteByIndex(item.model.Index);
                    this.delayRefresh();
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
                    this.delayRefresh();
                }
            }),
            vscode.commands.registerCommand('pacCLI.authPanel.navigateToResource', (item: AuthProfileTreeItem) => {
                if (item.model.ActiveOrganization) {
                    vscode.env.openExternal(vscode.Uri.parse(item.model.ActiveOrganization.Item2));
                }
            }),
            vscode.commands.registerCommand('pacCLI.authPanel.copyUser', (item: AuthProfileTreeItem) => {
                vscode.env.clipboard.writeText(item.model.UserDisplayName);
            })
        ];
    }
}

class AuthProfileTreeItem extends vscode.TreeItem {
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
            return `${profile.Kind}: ${profile.UserDisplayName}`;
        } else {
            return `${profile.Kind}: ${profile.ActiveOrganization?.Item2 ?? profile.UserDisplayName}`;
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
        if ((profile.Kind === "DATAVERSE" || profile.Kind === "UNIVERSAL") && profile.ActiveOrganization) {
            tooltip.push(vscode.l10n.t({
                message: "Default Environment: {0}",
                args: [profile.ActiveOrganization.Item2],
                comment: ["The {0} represents profile's resource/environment URL"]}));
        }
        tooltip.push(vscode.l10n.t({
            message: "User: {0}",
            args: [profile.UserDisplayName],
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

export function GetAuthProfileWatchPattern(): vscode.RelativePattern | undefined {
    if (os.platform() === 'win32') {
        return process.env.LOCALAPPDATA
            ? new vscode.RelativePattern(path.join(process.env.LOCALAPPDATA, "Microsoft", "PowerAppsCli"), "authprofiles*.json")
            : undefined;
    }
    else if (os.platform() === 'linux' || os.platform() === 'darwin') {
        return process.env.HOME
            ? new vscode.RelativePattern(path.join(process.env.HOME, ".local", "share", "Microsoft", "PowerAppsCli"), "authprofiles*.json")
            : undefined
    }

    return undefined;
}
