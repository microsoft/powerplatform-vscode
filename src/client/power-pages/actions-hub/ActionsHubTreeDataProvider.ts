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
import { refreshEnvironment, showEnvironmentDetails, switchEnvironment } from "./ActionsHubCommandHandlers";
import { IWebsiteDetails } from "../../../common/services/Interfaces";
import { getActiveWebsites, getAllWebsites } from "../../../common/utilities/WebsiteUtil";
import PacContext, { OnPacContextChanged } from "../../pac/PacContext";
import ArtemisContext from "../../ArtemisContext";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private _onDidChangeTreeData: vscode.EventEmitter<ActionsHubTreeItem | undefined | void> = new vscode.EventEmitter<ActionsHubTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ActionsHubTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private constructor(context: vscode.ExtensionContext, private readonly _pacTerminal: PacTerminal) {
        this._disposables.push(...this.registerPanel(this._pacTerminal));

        this._context = context;

        // Register an event listener for environment changes
        OnPacContextChanged(() => this.refresh());
    }

    public static initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal): ActionsHubTreeDataProvider {
        return new ActionsHubTreeDataProvider(context, pacTerminal);
    }

    getTreeItem(element: ActionsHubTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: ActionsHubTreeItem): Promise<ActionsHubTreeItem[] | null | undefined> {
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

            let activeSites: IWebsiteDetails[] = [];
            let inactiveSites: IWebsiteDetails[] = [];
            const orgInfo = PacContext.OrgInfo;

            if (ArtemisContext.ServiceResponse?.stamp && orgInfo) {
                let allSites: IWebsiteDetails[] = [];
                [activeSites, allSites] = await Promise.all([
                    getActiveWebsites(ArtemisContext.ServiceResponse?.stamp, orgInfo.EnvironmentId),
                    getAllWebsites(orgInfo)
                ]);
                const activeSiteIds = new Set(activeSites.map(activeSite => activeSite.WebsiteRecordId));
                inactiveSites = allSites?.filter(site => !activeSiteIds.has(site.WebsiteRecordId)) || []; //Need to handle failure case
            }
            else {
                //TODO: Handle the case when artemis response is not available
                // Log the scenario
                // Question: Should we show any message to the user? or just show the empty list of sites
            }

            //TODO: Handle the case when the user is not logged in

            return [
                new EnvironmentGroupTreeItem(currentEnvInfo, this._context, activeSites, inactiveSites),
                new OtherSitesGroupTreeItem()
            ];
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_CURRENT_ENV_FETCH_FAILED, error as string, error as Error, { methodName: this.getChildren }, {});
            return null;
        }
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }

    private registerPanel(pacTerminal: PacTerminal): vscode.Disposable[] {
        return [
            vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.actionsHub", this),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.refresh", async () => await refreshEnvironment(pacTerminal)),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.switchEnvironment", async () => await switchEnvironment(pacTerminal)),

            vscode.commands.registerCommand("microsoft.powerplatform.pages.actionsHub.showEnvironmentDetails", showEnvironmentDetails)
        ];
    }
}
