/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { GetAuthProfileWatchPattern } from "../client/lib/AuthPanelView";
import { PacWrapper } from "../client/pac/PacWrapper";
import * as vscode from "vscode";
import { PAC_SUCCESS } from "./copilot/constants";
import { ActiveOrgOutput } from "../client/pac/PacTypes";

export const orgChangeEventEmitter = new vscode.EventEmitter<ActiveOrgOutput>();
export const orgChangeEvent = orgChangeEventEmitter.event;
export const orgChangeErrorEventEmitter = new vscode.EventEmitter<void>();
export const orgChangeErrorEvent = orgChangeErrorEventEmitter.event;

export class OrgChangeNotifier {
    private _pacWrapper: PacWrapper | undefined;
    private _orgDetails: ActiveOrgOutput | undefined;
    private static _orgChangeNotifierObj: OrgChangeNotifier | undefined;
    private extensionContext: vscode.ExtensionContext;

    private constructor(pacWrapper: PacWrapper, extensionContext: vscode.ExtensionContext) {
        this._pacWrapper = pacWrapper;
        this.activeOrgDetails();
        if (this._pacWrapper) {
            this.setupFileWatcher();
        }

        this.extensionContext = extensionContext;
    }

    public static createOrgChangeNotifierInstance(pacWrapper: PacWrapper, extensionContext: vscode.ExtensionContext) {
        if (!OrgChangeNotifier._orgChangeNotifierObj) {
            OrgChangeNotifier._orgChangeNotifierObj = new OrgChangeNotifier(pacWrapper, extensionContext);
        }
        return OrgChangeNotifier._orgChangeNotifierObj;
    }

    private setupFileWatcher() {
        const watchPath = GetAuthProfileWatchPattern();
        if (watchPath) {
            const watcher = vscode.workspace.createFileSystemWatcher(watchPath);
            watcher.onDidChange(() => this.activeOrgDetails());
            watcher.onDidCreate(() => this.activeOrgDetails());
            watcher.onDidDelete(() => this.activeOrgDetails());
        }
    }

    private async activeOrgDetails() {
        const pacActiveOrg = await this._pacWrapper?.activeOrg();
        if (pacActiveOrg && pacActiveOrg.Status === PAC_SUCCESS) {
            this._orgDetails = pacActiveOrg.Results;

            await this.extensionContext.globalState.update('orgID', this._orgDetails.OrgId);

            orgChangeEventEmitter.fire(this._orgDetails);
        } else {
            orgChangeErrorEventEmitter.fire();
        }
    }
}
