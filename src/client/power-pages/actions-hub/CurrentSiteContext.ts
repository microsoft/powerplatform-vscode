/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { getCurrentSiteInfo } from '../../../common/utilities/Utils';
import { ICurrentSiteContext } from '../../../common/constants';

class CurrentSiteContext implements ICurrentSiteContext {
    private _currentSiteId: string | null = null;
    private _currentSiteFolderPath: string | null = null;
    private _disposables: vscode.Disposable[] = [];
    private readonly _onChanged = new vscode.EventEmitter<ICurrentSiteContext>();
    public readonly onChanged = this._onChanged.event;

    constructor() {
        const { currentSiteId, currentSiteFolderPath } = getCurrentSiteInfo();
        this._currentSiteId = currentSiteId;
        this._currentSiteFolderPath = currentSiteFolderPath;

        this._disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                const newSiteInfo = getCurrentSiteInfo();
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
}

export default new CurrentSiteContext();
