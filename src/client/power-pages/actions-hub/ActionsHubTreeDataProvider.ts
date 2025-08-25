/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./tree-items/ActionsHubTreeItem";
import { OtherSitesGroupTreeItem } from "./tree-items/OtherSitesGroupTreeItem";
import { AccountMismatchTreeItem } from "./tree-items/AccountMismatchTreeItem";
import { Constants } from "./Constants";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { EnvironmentGroupTreeItem } from "./tree-items/EnvironmentGroupTreeItem";
import { IEnvironmentInfo } from "./models/IEnvironmentInfo";
import { PacTerminal } from "../../lib/PacTerminal";
import { fetchWebsites, openActiveSitesInStudio, openInactiveSitesInStudio, previewSite, createNewAuthProfile, refreshEnvironment, showEnvironmentDetails, switchEnvironment, revealInOS, openSiteManagement, uploadSite, showSiteDetails, downloadSite, openInStudio, reactivateSite, runCodeQLScreening, loginToMatch } from "./ActionsHubCommandHandlers";
import PacContext from "../../pac/PacContext";
import CurrentSiteContext from "./CurrentSiteContext";
import { IOtherSiteInfo, IWebsiteDetails } from "../../../common/services/Interfaces";
import { orgChangeErrorEvent } from "../../OrgChangeNotifier";
import { getBaseEventInfo } from "./TelemetryHelper";
import { PROVIDER_ID } from "../../../common/services/Constants";
import { getOIDFromToken } from "../../../common/services/AuthenticationProvider";
import ArtemisContext from "../../ArtemisContext";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private _onDidChangeTreeData: vscode.EventEmitter<ActionsHubTreeItem | undefined | void> = new vscode.EventEmitter<ActionsHubTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ActionsHubTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private _activeSites: IWebsiteDetails[] = [];
    private _inactiveSites: IWebsiteDetails[] = [];
    private _otherSites: IOtherSiteInfo[] = [];
    private _loadWebsites = true;
    private _isCodeQlScanEnabled: boolean;

    private constructor(context: vscode.ExtensionContext, private readonly _pacTerminal: PacTerminal, isCodeQlScanEnabled: boolean) {
        this._isCodeQlScanEnabled = isCodeQlScanEnabled;
        this._disposables.push(
            ...this.registerPanel(this._pacTerminal),

            PacContext.onChanged(() => {
                this._loadWebsites = true;
                this.refresh();
            }),

            CurrentSiteContext.onChanged(() => this.refresh()),

            // Register an event listener for org change error as action hub will not be re-initialized in extension.ts
            orgChangeErrorEvent(() => this.refresh()),

            vscode.authentication.onDidChangeSessions((_) => {
                this._loadWebsites = true;
                this.refresh();
            })
        );
        this._context = context;
    }

    private refresh(): void {
        this._onDidChangeTreeData.fire();
        oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_REFRESH, { ...getBaseEventInfo() });
    }

    private async loadWebsites(): Promise<void> {
        if (this._loadWebsites) {
            try {
                vscode.commands.executeCommand('setContext', 'microsoft.powerplatform.pages.actionsHub.loadingWebsites', true);
                const websites = await fetchWebsites();
                this._activeSites = websites.activeSites;
                this._inactiveSites = websites.inactiveSites;
                this._otherSites = websites.otherSites;
                this._loadWebsites = false;
            } catch (error) {
                oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_LOAD_WEBSITES_FAILED, error as string, error as Error, { methodName: this.loadWebsites, ...getBaseEventInfo() }, {});
            } finally {
                vscode.commands.executeCommand('setContext', 'microsoft.powerplatform.pages.actionsHub.loadingWebsites', false);
            }
        }
    }

    private async checkAuthInfo(): Promise<boolean> {
        const authInfo = PacContext.AuthInfo;
        const session  = await vscode.authentication.getSession(PROVIDER_ID, [], { silent: true });

        if (session && session.accessToken && authInfo && authInfo.OrganizationFriendlyName) {
            return true;
        }

        return false;
    }

    private async checkAccountsMatch(): Promise<boolean> {
        oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_ACCOUNT_CHECK_CALLED, { methodName: this.checkAccountsMatch.name, ...getBaseEventInfo() });

        try {
            const authInfo = PacContext.AuthInfo;
            const session = await vscode.authentication.getSession(PROVIDER_ID, [], { silent: true });

            if (!session || !session.accessToken || !authInfo) {
                return false;
            }

            // Get user ID from VS Code session token
            const vscodeUserId = getOIDFromToken(session.accessToken);

            // Get user ID from PAC auth info
            const pacUserId = authInfo.EntraIdObjectId;

            // Check if both user IDs exist and match
            const accountsMatch = vscodeUserId && pacUserId && vscodeUserId === pacUserId;

            if (!accountsMatch) {
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_ACCOUNT_MISMATCH_DETECTED, {
                    methodName: this.checkAccountsMatch.name,
                    vscodeUserId: vscodeUserId || 'undefined',
                    pacUserId: pacUserId || 'undefined',
                    ...getBaseEventInfo()
                });
            }

            return accountsMatch;
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_ACCOUNT_CHECK_FAILED, error as string, error as Error, { methodName: this.checkAccountsMatch, ...getBaseEventInfo() });
            return false;
        }
    }

    private async checkAccountsMatch(): Promise<boolean> {
        oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_ACCOUNT_CHECK_CALLED, { methodName: this.checkAccountsMatch.name, ...getBaseEventInfo() });

        try {
            const authInfo = PacContext.AuthInfo;
            const session = await vscode.authentication.getSession(PROVIDER_ID, [], { silent: true });

            if (!session || !session.accessToken || !authInfo) {
                return false;
            }

            // Get user ID from VS Code session token
            const vscodeUserId = getOIDFromToken(session.accessToken);

            // Get user ID from PAC auth info
            const pacUserId = authInfo.EntraIdObjectId;

            // Check if both user IDs exist and match
            const accountsMatch = vscodeUserId && pacUserId && vscodeUserId === pacUserId;

            if (!accountsMatch) {
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_ACCOUNT_MISMATCH_DETECTED, {
                    methodName: this.checkAccountsMatch.name,
                    vscodeUserId: vscodeUserId || 'undefined',
                    pacUserId: pacUserId || 'undefined',
                    ...getBaseEventInfo()
                });
            }

            return accountsMatch;
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_ACCOUNT_CHECK_FAILED, error as string, error as Error, { methodName: this.checkAccountsMatch, ...getBaseEventInfo() });
            return false;
        }
    }

    public static initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal, isCodeQlScanEnabled: boolean): ActionsHubTreeDataProvider {
        return new ActionsHubTreeDataProvider(context, pacTerminal, isCodeQlScanEnabled);

    }

    getTreeItem(element: ActionsHubTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: ActionsHubTreeItem): Promise<ActionsHubTreeItem[] | null | undefined> {
        oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_TREE_GET_CHILDREN_CALLED, { methodName: this.getChildren.name, ...getBaseEventInfo() });

        if (element) {
            return element.getChildren();
        }

        try {
            const authInfo = PacContext.AuthInfo;
            if (await this.checkAuthInfo() === true ) {
                // Check if accounts match before loading websites
                const accountsMatch = await this.checkAccountsMatch();
                if (!accountsMatch) {
                    return [new AccountMismatchTreeItem()];
                }

                await this.loadWebsites();
                const currentEnvInfo: IEnvironmentInfo = {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    currentEnvironmentName: authInfo!.OrganizationFriendlyName //Already checked in checkAuthInfo
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
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_TREE_GET_CHILDREN_FAILED, error as string, error as Error, { methodName: this.getChildren, ...getBaseEventInfo() });
            return null;
        }
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }

    private registerPanel(pacTerminal: PacTerminal): vscode.Disposable[] {
        const commands = [
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

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.openInStudio", openInStudio),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.inactiveSite.reactivateSite", reactivateSite),
            
            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.loginToMatch", () => {
                const serviceEndpointStamp = ArtemisContext.ServiceResponse?.stamp;
                return loginToMatch(serviceEndpointStamp);
            }),
        ];

        if (this._isCodeQlScanEnabled) {
            commands.push(
                vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.currentActiveSite.runCodeQLScreening", runCodeQLScreening)
            );
        }

        return commands;
    }
}
