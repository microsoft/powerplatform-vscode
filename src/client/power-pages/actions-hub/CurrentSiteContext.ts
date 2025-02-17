/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'yaml';

interface ICurrentSiteContext {
    currentSiteId: string | null;
}

class CurrentSiteContext implements ICurrentSiteContext {
    private _currentSiteId: string | null = null;
    private _disposables: vscode.Disposable[] = [];
    private readonly _onChanged = new vscode.EventEmitter<string | null>();
    public readonly onChanged = this._onChanged.event;

    constructor() {
        this._currentSiteId = this.getCurrentSiteId();

        this._disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                const newSiteId = this.getCurrentSiteId();
                if (newSiteId !== this._currentSiteId) {
                    this._currentSiteId = newSiteId;
                    this._onChanged.fire(newSiteId);
                }
            })
        );
    }

    public get currentSiteId(): string | null {
        return this._currentSiteId;
    }

    public dispose() {
        this._onChanged.dispose();
        this._disposables.forEach(d => d.dispose());
    }

    private checkWebsiteYml(folderPath: string): string | null {
        try {
            const websiteYmlPath = path.join(folderPath, 'website.yml');
            if (fs.existsSync(websiteYmlPath)) {
                const fileContent = fs.readFileSync(websiteYmlPath, 'utf8');
                const parsedYaml = parse(fileContent);
                if (parsedYaml && parsedYaml.adx_websiteid) {
                    return parsedYaml.adx_websiteid;
                }
            }
        } catch (error) {
            //TODO: log error
        }
        return null;
    }

    private findWebsiteYmlFolder(startPath: string): string | null {
        let currentPath = startPath;
        while (currentPath) {
            if (fs.existsSync(path.join(currentPath, 'website.yml'))) {
                return currentPath;
            }
            const parentPath = path.dirname(currentPath);
            if (parentPath === currentPath) {
                break;
            }
            currentPath = parentPath;
        }
        return null;
    }

    private getCurrentSiteId(): string | null {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const filePath = activeEditor.document.uri.fsPath;
            const fileDirectory = path.dirname(filePath);
            const websiteYmlFolder = this.findWebsiteYmlFolder(fileDirectory);

            if (websiteYmlFolder) {
                const siteId = this.checkWebsiteYml(websiteYmlFolder);
                if (siteId) {
                    return siteId;
                }
            }
        }

        // Fallback: check first workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return this.checkWebsiteYml(workspaceFolders[0].uri.fsPath);
        }

        return null;
    }
}

export default new CurrentSiteContext();
