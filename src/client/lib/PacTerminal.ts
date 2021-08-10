// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';
import * as vscode from 'vscode';
import { PacInterop, PacWrapper, PacWrapperContext } from '../pac/PacWrapper';
import { ITelemetry } from '../telemetry/ITelemetry';

export class PacTerminal implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _cmdDisposables: vscode.Disposable[] = [];
    private readonly _pacWrapper: PacWrapper;

    public dispose(): void {
        this._cmdDisposables.forEach(cmd => cmd.dispose());
    }

    public constructor(context: vscode.ExtensionContext, telemetry: ITelemetry, cliPath: string) {
        this._context = context;
        const pacContext = new PacWrapperContext(context, telemetry);
        const interop = new PacInterop(pacContext);
        this._pacWrapper = new PacWrapper(pacContext, interop);

        // https://code.visualstudio.com/api/references/vscode-api#EnvironmentVariableCollection
        this._context.environmentVariableCollection.prepend('PATH', cliPath + path.delimiter);

        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.openDocumentation', this.openDocumentation));
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.openPacLab', this.openPacLab));
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.pacHelp',
            () => PacTerminal.getTerminal().sendText("pac help")));
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.pacAuthHelp',
            () => PacTerminal.getTerminal().sendText("pac auth help")));
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.pacPackageHelp',
            () => PacTerminal.getTerminal().sendText("pac package help")));
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.pacPcfHelp',
            () => PacTerminal.getTerminal().sendText("pac pcf help")));
        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.pacSolutionHelp',
            () => PacTerminal.getTerminal().sendText("pac solution help")));

        this._cmdDisposables.push(vscode.commands.registerCommand(`pacCLI.enableTelemetry`, async () => {
            const result = await this._pacWrapper.enableTelemetry();
            if (result?.Status === "Success") {
                vscode.window.showInformationMessage("PAC Telemetry enabled");
            } else {
                vscode.window.showErrorMessage("Failed to enable PAC telemetry.")
            }
        }));

        this._cmdDisposables.push(vscode.commands.registerCommand(`pacCLI.disableTelemetry`, async () => {
            const result = await this._pacWrapper.disableTelemetry();
            if (result?.Status === "Success") {
                vscode.window.showInformationMessage("PAC Telemetry disabled");
            } else {
                vscode.window.showErrorMessage("Failed to disable PAC telemetry.")
            }
        }));
    }

    public openDocumentation(): void {
        vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/pacvscodedocs'));
    }

    public openPacLab(): void {
        vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/pacvscodelab'));
    }

    private static getTerminal(): vscode.Terminal {
        const terminal = vscode.window.activeTerminal ?
            vscode.window.activeTerminal as vscode.Terminal :
            vscode.window.createTerminal();
        terminal.show();
        return terminal;
    }
}
