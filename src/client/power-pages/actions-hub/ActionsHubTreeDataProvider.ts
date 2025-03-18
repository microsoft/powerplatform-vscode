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
import { fetchWebsites, openActiveSitesInStudio, openInactiveSitesInStudio, previewSite, createNewAuthProfile, refreshEnvironment, showEnvironmentDetails, switchEnvironment, revealInOS, openSiteManagement, uploadSite, showSiteDetails, downloadSite, openInStudio } from "./ActionsHubCommandHandlers";
import PacContext from "../../pac/PacContext";
import CurrentSiteContext from "./CurrentSiteContext";
import { IOtherSiteInfo, IWebsiteDetails } from "../../../common/services/Interfaces";
import { orgChangeErrorEvent } from "../../OrgChangeNotifier";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private _onDidChangeTreeData: vscode.EventEmitter<ActionsHubTreeItem | undefined | void> = new vscode.EventEmitter<ActionsHubTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ActionsHubTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private _activeSites: IWebsiteDetails[] = [];
    private _inactiveSites: IWebsiteDetails[] = [];
    private _otherSites: IOtherSiteInfo[] = [];
    private _loadWebsites = true;

    private constructor(context: vscode.ExtensionContext, private readonly _pacTerminal: PacTerminal) {
        this._disposables.push(
            ...this.registerPanel(this._pacTerminal),

            PacContext.onChanged(() => {
                this._loadWebsites = true;
                this.refresh();
            }),

            CurrentSiteContext.onChanged(() => this.refresh()),

            // Register an event listener for org change error as action hub will not be re-initialized in extension.ts
            orgChangeErrorEvent(() => this.refresh())
        );
        this._context = context;
    }

    private refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    private async loadWebsites(): Promise<void> {
        if (this._loadWebsites) {
            const websites = await fetchWebsites();
            this._activeSites = websites.activeSites;
            this._inactiveSites = websites.inactiveSites;
            this._otherSites = websites.otherSites;
            this._loadWebsites = false;
        }
    }

    public static initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal): ActionsHubTreeDataProvider {
        return new ActionsHubTreeDataProvider(context, pacTerminal);
    }

    getTreeItem(element: ActionsHubTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: ActionsHubTreeItem): Promise<ActionsHubTreeItem[] | null | undefined> {
        await this.loadWebsites();

        if (element) {
            return element.getChildren();
        }

        try {
            const authInfo = PacContext.AuthInfo;
            if (authInfo && authInfo.OrganizationFriendlyName) {
                const currentEnvInfo: IEnvironmentInfo = {
                    currentEnvironmentName: authInfo.OrganizationFriendlyName
                };

                if(!this._otherSites.length){
                    return [new EnvironmentGroupTreeItem(currentEnvInfo, this._context, this._activeSites, this._inactiveSites)];
                }
                return [
                    new EnvironmentGroupTreeItem(currentEnvInfo, this._context, this._activeSites, this._inactiveSites),
                    new OtherSitesGroupTreeItem(this._otherSites)
                ];
            } else {
                // Login experience scenario
                return [];
            }
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

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.preview", previewSite),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.newAuthProfile", async () => {
                await createNewAuthProfile(pacTerminal.getWrapper());
            }),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.windows", revealInOS),
            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.mac", revealInOS),
            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.linux", revealInOS),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.inactiveSite.openSiteManagement", openSiteManagement),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.uploadSite", uploadSite),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.siteDetails", showSiteDetails),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.downloadSite", downloadSite),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.openInStudio", openInStudio)
        ];
    }
}
