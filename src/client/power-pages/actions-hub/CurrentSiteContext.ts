/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { findWebsiteYmlFolder, getWebsiteRecordId } from '../../../common/utilities/WorkspaceInfoFinderUtil';

interface ICurrentSiteContext {
    currentSiteId: string | null;
    currentSiteFolderPath: string | null;
}

class CurrentSiteContext implements ICurrentSiteContext {
    private _currentSiteId: string | null = null;
    private _currentSiteFolderPath: string | null = null;
    private _disposables: vscode.Disposable[] = [];
    private readonly _onChanged = new vscode.EventEmitter<ICurrentSiteContext>();
    public readonly onChanged = this._onChanged.event;

    constructor() {
        const { currentSiteId, currentSiteFolderPath } = this.getCurrentSiteInfo();
        this._currentSiteId = currentSiteId;
        this._currentSiteFolderPath = currentSiteFolderPath;

        this._disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                const newSiteInfo = this.getCurrentSiteInfo();
                if (newSiteInfo.currentSiteId !== this._currentSiteId) {
                    this._currentSiteId = newSiteInfo.currentSiteId;
                    this._currentSiteFolderPath = newSiteInfo.currentSiteFolderPath;
                    this._onChanged.fire(newSiteInfo);
                }
            })
        );
    }

    public get currentSiteId(): string | null {
        return this._currentSiteId;
    }

    public get currentSiteFolderPath(): string | null {
        return this._currentSiteFolderPath;
    }

    public dispose() {
        this._onChanged.dispose();
        this._disposables.forEach(d => d.dispose());
    }

    private getCurrentSiteInfo(): ICurrentSiteContext {
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
            return { currentSiteId: getWebsiteRecordId(workspaceFolders[0].uri.fsPath), currentSiteFolderPath: workspaceFolders[0].uri.fsPath };
        }

        return { currentSiteId: null, currentSiteFolderPath: null };
    }
}

export default new CurrentSiteContext();
