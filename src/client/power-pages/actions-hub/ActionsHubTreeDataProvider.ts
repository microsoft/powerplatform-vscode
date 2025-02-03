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
import { pacAuthManager } from "../../pac/PacAuthManager";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this._disposables.push(
            vscode.window.registerTreeDataProvider("powerpages.actionsHub", this)
        );

        this._context = context;
    }

    public static initialize(context: vscode.ExtensionContext): ActionsHubTreeDataProvider {
        const actionsHubTreeDataProvider = new ActionsHubTreeDataProvider(context);
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
                const authInfo = pacAuthManager.getAuthInfo();
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

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }
}
