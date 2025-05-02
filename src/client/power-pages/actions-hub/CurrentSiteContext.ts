/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ICurrentSiteContext } from '../../../common/constants';
import path from 'path';
import { findWebsiteYmlFolder, getWebsiteRecordId } from '../../../common/utilities/WorkspaceInfoFinderUtil';

class CurrentSiteContext implements ICurrentSiteContext {
    private _currentSiteId: string | null = null;
    private _currentSiteFolderPath: string | null = null;
    private _disposables: vscode.Disposable[] = [];
    private readonly _onChanged = new vscode.EventEmitter<ICurrentSiteContext>();
    public readonly onChanged = this._onChanged.event;
    private _isInitialized = false;

    constructor() {
        // Initialize with default values, then update asynchronously
        this._initialize();
        
        this._disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                this._updateSiteContext();
            })
        );
    }

    private async _initialize(): Promise<void> {
        const siteInfo = getCurrentSiteInfo();
        this._currentSiteId = siteInfo.currentSiteId;
        this._currentSiteFolderPath = siteInfo.currentSiteFolderPath;
        this._isInitialized = true;
    }

    private async _updateSiteContext(): Promise<void> {
        const newSiteInfo = getCurrentSiteInfo();
        if (newSiteInfo.currentSiteId !== this._currentSiteId) {
            this._currentSiteId = newSiteInfo.currentSiteId;
            this._currentSiteFolderPath = newSiteInfo.currentSiteFolderPath;
            this._onChanged.fire(newSiteInfo);
        }
    }

    public get currentSiteId(): string | null {
        return this._currentSiteId;
    }

    public get currentSiteFolderPath(): string | null {
        return this._currentSiteFolderPath;
    }

    public get isInitialized(): boolean {
        return this._isInitialized;
    }

    public dispose(): void {
        this._onChanged.dispose();
        this._disposables.forEach(d => d.dispose());
    }
}

export default new CurrentSiteContext();

export function getCurrentSiteInfo():ICurrentSiteContext {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        const filePath = activeEditor.document.uri.fsPath;
        const fileDirectory = path.dirname(filePath);
        const websiteYmlFolder = findWebsiteYmlFolder(fileDirectory);

        if (websiteYmlFolder) {
            const siteId = getWebsiteRecordId(websiteYmlFolder);
            if (siteId) {
                return { currentSiteId: siteId, currentSiteFolderPath: websiteYmlFolder };
            }
        }
    }

    // Fallback: check first workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const siteId = getWebsiteRecordId(workspaceFolders[0].uri.fsPath);
        return { currentSiteId: siteId, currentSiteFolderPath: workspaceFolders[0].uri.fsPath };
    }

    return { currentSiteId: null, currentSiteFolderPath: null };
}