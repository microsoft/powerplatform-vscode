/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./tree-items/ActionsHubTreeItem";
import { OtherSitesGroupTreeItem } from "./tree-items/OtherSitesGroupTreeItem";
import { Constants } from "./Constants";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { EnvironmentGroupTreeItem } from "./tree-items/EnvironmentGroupTreeItem";
import { IEnvironmentInfo } from "./models/IEnvironmentInfo";
import { PacTerminal } from "../../lib/PacTerminal";
import { fetchWebsites, openActiveSitesInStudio, openInactiveSitesInStudio, previewSite, refreshEnvironment, showEnvironmentDetails, switchEnvironment } from "./ActionsHubCommandHandlers";
import PacContext from "../../pac/PacContext";
import { IWebsiteInfo } from "./models/IWebsiteInfo";
import CurrentSiteContext from "./CurrentSiteContext";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private _onDidChangeTreeData: vscode.EventEmitter<ActionsHubTreeItem | undefined | void> = new vscode.EventEmitter<ActionsHubTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ActionsHubTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private _activeSites: IWebsiteInfo[] = [];
    private _inactiveSites: IWebsiteInfo[] = [];
    private _isFirstLoad = true;

    private constructor(context: vscode.ExtensionContext, private readonly _pacTerminal: PacTerminal) {
        this._disposables.push(
            ...this.registerPanel(this._pacTerminal),

            PacContext.onChanged(async () => await this.refresh(true)),

            CurrentSiteContext.onChanged(async () => await this.refresh(false))
        );
        this._context = context;
    }

    public async refresh(fetchSites: boolean): Promise<void> {
        await this.loadWebsites(fetchSites);
        this._onDidChangeTreeData.fire();
    }

    private async loadWebsites(fetchSites: boolean): Promise<void> {
        if (fetchSites) {
            const websites = await fetchWebsites();
            this._activeSites = websites.activeSites;
            this._inactiveSites = websites.inactiveSites;
        }

        if (CurrentSiteContext.currentSiteId) {
            for (const site of this._activeSites) {
                site.isCurrent = site.websiteId === CurrentSiteContext.currentSiteId;
            }
        }
    }

    public static initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal): ActionsHubTreeDataProvider {
        return new ActionsHubTreeDataProvider(context, pacTerminal);
    }

    getTreeItem(element: ActionsHubTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: ActionsHubTreeItem): Promise<ActionsHubTreeItem[] | null | undefined> {
        if (this._isFirstLoad) {
            this._isFirstLoad = false;
            await this.loadWebsites(true);
        }

        if (element) {
            return element.getChildren();
        }

        try {
            const orgFriendlyName = Constants.Strings.NO_ENVIRONMENTS_FOUND; // Login experience scenario
            let currentEnvInfo: IEnvironmentInfo = { currentEnvironmentName: orgFriendlyName };
            const authInfo = PacContext.AuthInfo;
            if (authInfo) {
                currentEnvInfo = { currentEnvironmentName: authInfo.OrganizationFriendlyName };
            }

            return [
                new EnvironmentGroupTreeItem(currentEnvInfo, this._context, this._activeSites, this._inactiveSites),
                new OtherSitesGroupTreeItem()
            ];
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_CURRENT_ENV_FETCH_FAILED, error as string, error as Error, { methodName: this.getChildren }, {});
            return null;
        }
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }

    private registerPanel(pacTerminal: PacTerminal): vscode.Disposable[] {
        return [
            vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.actionsHub", this),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.refresh", async () => await refreshEnvironment(pacTerminal)),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.switchEnvironment", async () => await switchEnvironment(pacTerminal)),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.showEnvironmentDetails", showEnvironmentDetails),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.openActiveSitesInStudio", openActiveSitesInStudio),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.openInactiveSitesInStudio", openInactiveSitesInStudio),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.preview", previewSite)
        ];
    }
}
