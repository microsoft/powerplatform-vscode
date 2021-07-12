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
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.pacAuthHelp',
            () => PacTerminal.getTerminal().sendText("pac auth help")));
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.pacPackageHelp',
            () => PacTerminal.getTerminal().sendText("pac package help")));
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.pacPcfHelp',
            () => PacTerminal.getTerminal().sendText("pac pcf help")));
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.pacSolutionHelp',
            () => PacTerminal.getTerminal().sendText("pac solution help")));
    }

    public openDocumentation(): void {
        vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/pacvscodedocs'));
    }

    private static getTerminal(): vscode.Terminal {
        const terminal = vscode.window.activeTerminal ?
            vscode.window.activeTerminal as vscode.Terminal :
            vscode.window.createTerminal();
        terminal.show();
        return terminal;
    }
}
