/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./tree-items/ActionsHubTreeItem";
import { OtherSitesGroupTreeItem } from "./tree-items/OtherSitesGroupTreeItem";
import { Constants } from "./Constants";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { PacTerminal } from "../../lib/PacTerminal";
import { EnvironmentGroupTreeItem } from "./tree-items/EnvironmentGroupTreeItem";
import { IEnvironmentInfo } from "./models/IEnvironmentInfo";
import { authManager } from "../../pac/PacAuthManager";
import { SUCCESS } from "../../../common/constants";
import { extractAuthInfo } from "../commonUtility";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private readonly _pacTerminal: PacTerminal;
    private _onDidChangeTreeData: vscode.EventEmitter<ActionsHubTreeItem | undefined | void> = new vscode.EventEmitter<ActionsHubTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ActionsHubTreeItem | undefined | void> = this._onDidChangeTreeData.event;


    private constructor(context: vscode.ExtensionContext, pacTerminal: PacTerminal) {
        this._disposables.push(
            vscode.window.registerTreeDataProvider("powerpages.actionsHub", this)
        );

        this._context = context;
        this._pacTerminal = pacTerminal;

        // Register an event listener for environment changes
        authManager.onDidChangeEnvironment(() => this.refresh());
        this._disposables.push(...this.registerPanel(this._pacTerminal));
    }

    public static initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal): ActionsHubTreeDataProvider {
        const actionsHubTreeDataProvider = new ActionsHubTreeDataProvider(context, pacTerminal);
        oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_INITIALIZED);

        return actionsHubTreeDataProvider;
    }

    getTreeItem(element: ActionsHubTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: ActionsHubTreeItem): Promise<ActionsHubTreeItem[] | null | undefined> {
        if (!element) {
            try {

                const orgFriendlyName = Constants.Strings.NO_ENVIRONMENTS_FOUND; // Login experience scenario
                let currentEnvInfo: IEnvironmentInfo = { currentEnvironmentName: orgFriendlyName };
                const authInfo = authManager.getAuthInfo();
                if (authInfo) {
                    currentEnvInfo = { currentEnvironmentName: authInfo.organizationFriendlyName };
                }

                //TODO: Handle the case when the user is not logged in

                return [
                    new EnvironmentGroupTreeItem(currentEnvInfo, this._context),
                    new OtherSitesGroupTreeItem()
                ];
            } catch (error) {
                oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_CURRENT_ENV_FETCH_FAILED, error as string, error as Error, { methodName: this.getChildren }, {});
                return null;
            }
        } else {
            return [];
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
            vscode.commands.registerCommand("powerpages.actionsHub.refresh", async () => {
                const pacActiveAuth = await pacTerminal.getWrapper()?.activeAuth();
                if (pacActiveAuth && pacActiveAuth.Status === SUCCESS) {
                    const authInfo = extractAuthInfo(pacActiveAuth.Results);
                    authManager.setAuthInfo(authInfo);
                }
                this.refresh();
            }),
        ];
    }
}
