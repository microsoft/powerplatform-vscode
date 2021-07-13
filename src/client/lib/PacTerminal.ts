// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
import * as vscode from 'vscode';

export class PacTerminal implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _cmdDisposables: vscode.Disposable[] = [];

    public dispose(): void {
        this._cmdDisposables.forEach(cmd => cmd.dispose());
    }

    public constructor(context: vscode.ExtensionContext, cliPath: string) {
        this._context = context;

        // https://code.visualstudio.com/api/references/vscode-api#EnvironmentVariableCollection
        this._context.environmentVariableCollection.prepend('PATH', cliPath + path.delimiter);

        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.openDocumentation', this.openDocumentation));
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.openPacLab', this.openPacLab));
    }

    public openDocumentation(): void {
        vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/pacvscodedocs'));
    }

    public openPacLab(): void {
        vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/pacvscodelab'));
    }
}
