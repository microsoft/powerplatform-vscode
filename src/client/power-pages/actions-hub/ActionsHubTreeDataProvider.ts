/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./tree-items/ActionsHubTreeItem";
import { OtherSitesGroupTreeItem } from "./tree-items/OtherSitesGroupTreeItem";
import { ITelemetry } from "../../../common/OneDSLoggerTelemetry/telemetry/ITelemetry";
import { Constants } from "./Constants";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private readonly _telemetry: ITelemetry;

    private constructor(context: vscode.ExtensionContext, telemetry: ITelemetry) {
        this._disposables.push(
            vscode.window.registerTreeDataProvider("powerpages.actionsHub", this)
        );

        this._context = context;
        this._telemetry = telemetry;
    }

    public static initialize(context: vscode.ExtensionContext, telemetry: ITelemetry): void {
        new ActionsHubTreeDataProvider(context, telemetry);

        telemetry.sendTelemetryEvent(Constants.EventNames.ACTIONS_HUB_INITIALIZED);
        oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_INITIALIZED);
    }

    getTreeItem(element: ActionsHubTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ActionsHubTreeItem | undefined): vscode.ProviderResult<ActionsHubTreeItem[]> {
        if (!element) {
            return [
                new OtherSitesGroupTreeItem()
            ];
        } else {
            return [];
        }
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }
}
