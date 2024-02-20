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

export class OrgChangeNotifier {
    private _pacWrapper: PacWrapper | undefined;
    private _orgDetails: ActiveOrgOutput | undefined;
    private static _orgChangeNotifierObj: OrgChangeNotifier | undefined;

    private constructor(pacWrapper: PacWrapper) {
        this._pacWrapper = pacWrapper;
        this.activeOrgDetails();
        if (this._pacWrapper) {
            this.setupFileWatcher();
        }
    }

    public static createOrgChangeNotifierInstance(pacWrapper: PacWrapper) {
        if (!OrgChangeNotifier._orgChangeNotifierObj) {
            OrgChangeNotifier._orgChangeNotifierObj = new OrgChangeNotifier(pacWrapper);
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
            orgChangeEventEmitter.fire(this._orgDetails);
        }
    }
}