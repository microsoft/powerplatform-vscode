// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';

const publisherName = 'microsoft-IsvExpTools';

export class PacTerminal implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _cmdDisposables: vscode.Disposable[] = [];

    public dispose(): void {
        this._cmdDisposables.forEach(cmd => cmd.dispose());
    }

    public constructor(context: vscode.ExtensionContext, cliPath: string) {
        this._context = context;

        // https://code.visualstudio.com/api/references/vscode-api#EnvironmentVariableCollection
        this._context.environmentVariableCollection.prepend('PATH', cliPath + ';');
        this._cmdDisposables.push(vscode.commands.registerCommand(`${publisherName}.pac.createTerminal`, this.createCliTerminal));
    }

    public createCliTerminal(...args: any[]): void {
        vscode.window.showInformationMessage(`open: terminal`);
    }

}
