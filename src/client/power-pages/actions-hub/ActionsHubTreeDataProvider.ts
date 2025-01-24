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
import { SUCCESS } from "../../../common/constants";
import { EnvironmentGroupTreeItem } from "./tree-items/EnvironmentGroupTreeItem";
import { IEnvironmentInfo } from "./models/IEnvironmentInfo";
import { OrganizationFriendlyNameKey } from "../../../common/OneDSLoggerTelemetry/telemetryConstants";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private readonly _pacTerminal: PacTerminal;

    private constructor(context: vscode.ExtensionContext, pacTerminal: PacTerminal) {
        this._disposables.push(
            vscode.window.registerTreeDataProvider("powerpages.actionsHub", this)
        );

        this._context = context;
        this._pacTerminal = pacTerminal;
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
                const pacWrapper = this._pacTerminal.getWrapper();
                const pacActiveAuth = await pacWrapper?.activeAuth();
                let orgFriendlyName = Constants.Strings.NO_ENVIRONMENTS_FOUND; // Login experience scenario
                let currentEnvInfo: IEnvironmentInfo = { currentEnvironmentName: orgFriendlyName };

                if (pacActiveAuth && pacActiveAuth.Status === SUCCESS) {
                    // Currently only filtering out the OrganizationFriendlyNameKey, but we can all the keys for showing session info
                    const result = pacActiveAuth.Results?.find(obj => obj.Key === OrganizationFriendlyNameKey);
                    if (result) {
                        orgFriendlyName = result.Value;
                        currentEnvInfo = { currentEnvironmentName: orgFriendlyName };
                    }
                }

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
