/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { GetAuthProfileWatchPattern } from "./lib/AuthPanelView";
import { PacWrapper } from "./pac/PacWrapper";
import * as vscode from "vscode";
import { ActiveOrgOutput } from "./pac/PacTypes";
import { SUCCESS } from "../common/constants";

export const orgChangeEventEmitter = new vscode.EventEmitter<ActiveOrgOutput>();
export const orgChangeEvent = orgChangeEventEmitter.event;
export const orgChangeErrorEventEmitter = new vscode.EventEmitter<void>();
export const orgChangeErrorEvent = orgChangeErrorEventEmitter.event;

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
        if (pacActiveOrg && pacActiveOrg.Status === SUCCESS) {
            this._orgDetails = pacActiveOrg.Results;
            orgChangeEventEmitter.fire(this._orgDetails);
        } else {
            //If org/env is expired or deleted, this event will be fired
            orgChangeErrorEventEmitter.fire();
        }
    }
}
