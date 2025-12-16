/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./tree-items/ActionsHubTreeItem";
import { OtherSitesGroupTreeItem } from "./tree-items/OtherSitesGroupTreeItem";
import { ToolsGroupTreeItem } from "./tree-items/ToolsGroupTreeItem";
import { AccountMismatchTreeItem } from "./tree-items/AccountMismatchTreeItem";
import { Constants } from "./Constants";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { EnvironmentGroupTreeItem } from "./tree-items/EnvironmentGroupTreeItem";
import { IEnvironmentInfo } from "./models/IEnvironmentInfo";
import { PacTerminal } from "../../lib/PacTerminal";
import { runCodeQLScreening } from "./handlers/code-ql/RunCodeQlScreeningHandler";
import { revealInOS } from "./handlers/RevealInOSHandler";
import { createNewAuthProfile } from "./handlers/CreateNewAuthProfileHandler";
import { previewSite } from "./handlers/PreviewSiteHandler";
import { openActiveSitesInStudio, openInactiveSitesInStudio, openSiteInStudio } from "./handlers/OpenSiteInStudioHandler";
import { switchEnvironment } from "./handlers/SwitchEnvironmentHandler";
import { showEnvironmentDetails } from "./handlers/ShowEnvironmentDetailsHandler";
import { refreshEnvironment } from "./handlers/RefreshEnvironmentHandler";
import PacContext from "../../pac/PacContext";
import CurrentSiteContext from "./CurrentSiteContext";
import { IOtherSiteInfo, IWebsiteDetails } from "../../../common/services/Interfaces";
import { orgChangeErrorEvent } from "../../OrgChangeNotifier";
import { getBaseEventInfo } from "./TelemetryHelper";
import { PROVIDER_ID } from "../../../common/services/Constants";
import { getOIDFromToken } from "../../../common/services/AuthenticationProvider";
import ArtemisContext from "../../ArtemisContext";
import { fetchWebsites } from "./ActionsHubUtils";
import { openSiteManagement } from "./handlers/OpenSiteManagementHandler";
import { reactivateSite } from "./handlers/ReactivateSiteHandler";
import { uploadSite } from "./handlers/UploadSiteHandler";
import { showSiteDetails } from "./handlers/ShowSiteDetailsHandler";
import { downloadSite } from "./handlers/DownloadSiteHandler";
import { loginToMatch } from "./handlers/LoginToMatchHandler";
import { ActionsHub } from "./ActionsHub";
import { compareWithLocal } from "./handlers/metadata-diff/CompareWithLocalHandler";
import { compareWithEnvironment } from "./handlers/metadata-diff/CompareWithEnvironmentHandler";
import MetadataDiffContext from "./MetadataDiffContext";
import { openMetadataDiffFile } from "./handlers/metadata-diff/OpenMetadataDiffFileHandler";
import { openAllMetadataDiffs } from "./handlers/metadata-diff/OpenAllMetadataDiffsHandler";
import { clearMetadataDiff } from "./handlers/metadata-diff/ClearMetadataDiffHandler";
import { viewAsTree, viewAsList } from "./handlers/metadata-diff/ToggleViewModeHandler";
import { sortByName, sortByPath, sortByStatus } from "./handlers/metadata-diff/SortModeHandler";
import { MetadataDiffDecorationProvider } from "./MetadataDiffDecorationProvider";
import { removeSiteComparison } from "./handlers/metadata-diff/RemoveSiteHandler";
import { discardLocalChanges } from "./handlers/metadata-diff/DiscardLocalChangesHandler";
import { discardFolderChanges } from "./handlers/metadata-diff/DiscardFolderChangesHandler";
import { generateHtmlReport } from "./handlers/metadata-diff/GenerateHtmlReportHandler";
import { exportMetadataDiff } from "./handlers/metadata-diff/ExportMetadataDiffHandler";
import { importMetadataDiff } from "./handlers/metadata-diff/ImportMetadataDiffHandler";
import { resyncMetadataDiff } from "./handlers/metadata-diff/ResyncMetadataDiffHandler";

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
        this._context = context;

        // Initialize MetadataDiffContext with extension context for state persistence
        MetadataDiffContext.initialize(context);

        this._disposables.push(
            ...this.registerPanel(),

            PacContext.onChanged(() => {
                this._loadWebsites = true;
                this.refresh();
            }),

            CurrentSiteContext.onChanged(() => this.refresh()),

            // Register an event listener for org change error as action hub will not be re-initialized in extension.ts
            orgChangeErrorEvent(() => this.refresh()),

            vscode.authentication.onDidChangeSessions((event) => {
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_REFRESH, {
                    methodName: 'onDidChangeSessions',
                    eventProvider: event.provider?.id || 'unknown',
                    triggerReason: 'authentication_session_changed',
                    ...getBaseEventInfo()
                });
                this._loadWebsites = true;
                this.refresh();
            }),

            // Subscribe to metadata diff changes to refresh tree when diff results are updated
            MetadataDiffContext.onChanged(() => this.refresh())
        );
    }

    private refresh(): void {
        this._onDidChangeTreeData.fire();
        oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_REFRESH, { ...getBaseEventInfo() });
    }

    private async loadWebsites(): Promise<void> {
        if (this._loadWebsites) {
            try {
                vscode.commands.executeCommand('setContext', 'microsoft.powerplatform.pages.actionsHub.loadingWebsites', true);
                const websites = await fetchWebsites(PacContext.OrgInfo!, true);
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
        const session = await vscode.authentication.getSession(PROVIDER_ID, [], { silent: true });

        if (session && session.accessToken && authInfo && authInfo.OrganizationFriendlyName) {
            return true;
        }

        return false;
    }

    private async checkAccountsMatch(): Promise<boolean> {
        try {
            const authInfo = PacContext.AuthInfo;
            const session = await vscode.authentication.getSession(PROVIDER_ID, [], { silent: true });

            if (!session || !session.accessToken || !authInfo) {
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_ACCOUNT_CHECK_CALLED, {
                    methodName: this.checkAccountsMatch.name,
                    result: 'missing_session_or_auth',
                    hasSession: !!session,
                    hasAccessToken: !!session?.accessToken,
                    hasPacAuthInfo: !!authInfo,
                    ...getBaseEventInfo()
                });
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
                    vscodeUserIdLength: vscodeUserId?.length || 0,
                    pacUserIdLength: pacUserId?.length || 0,
                    hasVscodeUserId: !!vscodeUserId,
                    hasPacUserId: !!pacUserId,
                    environmentId: authInfo.EnvironmentId,
                    organizationFriendlyName: authInfo.OrganizationFriendlyName,
                    ...getBaseEventInfo()
                });
            } else {
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_ACCOUNT_MATCH_RESOLVED, {
                    methodName: this.checkAccountsMatch.name,
                    vscodeUserIdLength: vscodeUserId?.length || 0,
                    pacUserIdLength: pacUserId?.length || 0,
                    environmentId: authInfo.EnvironmentId,
                    organizationFriendlyName: authInfo.OrganizationFriendlyName,
                    ...getBaseEventInfo()
                });
            }

            return !!accountsMatch;
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_ACCOUNT_CHECK_FAILED, error as string, error as Error, {
                methodName: this.checkAccountsMatch.name,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                ...getBaseEventInfo()
            });
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
            if (await this.checkAuthInfo() === true) {
                // Check if accounts match before loading websites
                const accountsMatch = await this.checkAccountsMatch();
                if (!accountsMatch) {
                    oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_ACCOUNT_MISMATCH_UI_SHOWN, {
                        methodName: this.getChildren.name,
                        authInfoAvailable: !!authInfo,
                        environmentId: authInfo?.EnvironmentId,
                        organizationFriendlyName: authInfo?.OrganizationFriendlyName,
                        ...getBaseEventInfo()
                    });
                    return [new AccountMismatchTreeItem()];
                }

                await this.loadWebsites();
                const currentEnvInfo: IEnvironmentInfo = {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    currentEnvironmentName: authInfo!.OrganizationFriendlyName //Already checked in checkAuthInfo
                };

                const children: ActionsHubTreeItem[] = [
                    new EnvironmentGroupTreeItem(currentEnvInfo, this._context, this._activeSites, this._inactiveSites)
                ];

                // Add other sites group if there are other sites
                if (this._otherSites.length) {
                    children.push(new OtherSitesGroupTreeItem(this._otherSites));
                }

                // Add tools group (contains MetadataDiffGroupTreeItem when feature is enabled)
                children.push(new ToolsGroupTreeItem());

                return children;
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

    private registerPanel(): vscode.Disposable[] {
        const commands = [
            vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.actionsHub", this),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.refresh", async () => await refreshEnvironment(this._pacTerminal)),
            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.switchEnvironment", async () => await switchEnvironment(this._pacTerminal)),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.showEnvironmentDetails", showEnvironmentDetails),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.openActiveSitesInStudio", openActiveSitesInStudio),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.openInactiveSitesInStudio", openInactiveSitesInStudio),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.preview", previewSite),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.newAuthProfile", async () => {
                await createNewAuthProfile(this._pacTerminal.getWrapper());
            }),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.windows", revealInOS),
            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.mac", revealInOS),
            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.currentActiveSite.revealInOS.linux", revealInOS),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.inactiveSite.openSiteManagement", openSiteManagement),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.uploadSite", uploadSite),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.siteDetails", showSiteDetails),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.downloadSite", downloadSite),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.openInStudio", openSiteInStudio),

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

        if (ActionsHub.isMetadataDiffEnabled()) {
            commands.push(
                vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.activeSite.compareWithLocal", compareWithLocal(this._pacTerminal, this._context)),
                vscode.commands.registerCommand(Constants.Commands.COMPARE_WITH_ENVIRONMENT, compareWithEnvironment(this._pacTerminal, this._context)),
                vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.showOutputChannel", () => this._pacTerminal.getWrapper().showOutputChannel()),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_OPEN_FILE, openMetadataDiffFile),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_OPEN_ALL, openAllMetadataDiffs),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_CLEAR, clearMetadataDiff),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_REMOVE_SITE, removeSiteComparison),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_VIEW_AS_TREE, viewAsTree),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_VIEW_AS_LIST, viewAsList),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_SORT_BY_NAME, sortByName),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_SORT_BY_PATH, sortByPath),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_SORT_BY_STATUS, sortByStatus),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_DISCARD_FILE, discardLocalChanges),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_DISCARD_FOLDER, discardFolderChanges),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_GENERATE_HTML_REPORT, generateHtmlReport),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_EXPORT, exportMetadataDiff),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_IMPORT, importMetadataDiff),
                vscode.commands.registerCommand(Constants.Commands.METADATA_DIFF_RESYNC, resyncMetadataDiff(this._pacTerminal, this._context)),
                MetadataDiffDecorationProvider.getInstance().register()
            );
        }

        return commands;
    }
}
