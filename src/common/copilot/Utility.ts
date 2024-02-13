/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { GetAuthProfileWatchPattern } from "../../client/lib/AuthPanelView";
import * as vscode from "vscode";

export const setupFileWatcher = (handleChangeFn: () => Promise<void>, disposables?: vscode.Disposable[]) => {
    const watchPath = GetAuthProfileWatchPattern();
    if (watchPath) {
        const watcher = vscode.workspace.createFileSystemWatcher(watchPath);
        if(disposables){
            disposables?.push(
                watcher,
                watcher.onDidChange(() => handleChangeFn()),
                watcher.onDidCreate(() => handleChangeFn()),
                watcher.onDidDelete(() => handleChangeFn())
            );
        }else{
            watcher.onDidChange(() => handleChangeFn());
            watcher.onDidCreate(() => handleChangeFn());
            watcher.onDidDelete(() => handleChangeFn());
        }
        
    }
}