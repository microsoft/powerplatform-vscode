// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { PacInterop, PacWrapper, PacWrapperContext } from '../pac/PacWrapper';
import { ITelemetry } from '../telemetry/ITelemetry';
import { solutionInitPrompt } from './ui/solutionInitPrompt';
import { pcfInitPrompt } from './ui/pcfInitPrompt';

export class PacTerminal implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _cmdDisposables: vscode.Disposable[] = [];
    private readonly _pacWrapper: PacWrapper;

    public dispose(): void {
        this._cmdDisposables.forEach(cmd => cmd.dispose());
    }

    public static async create(context: vscode.ExtensionContext, telemetry: ITelemetry, cliPath: string): Promise<PacTerminal>{
        const pacContext = new PacWrapperContext(context, telemetry);
        const interop = await PacInterop.create(pacContext);
        const pacWrapper = new PacWrapper(pacContext, interop);

        const pacTerminal = new PacTerminal(context, cliPath, pacWrapper);
        return pacTerminal;
    }

    private constructor(context: vscode.ExtensionContext, cliPath: string, pacWrapper: PacWrapper) {
        this._context = context;
        this._pacWrapper = pacWrapper;

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

        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.explorer.packageInit',
            async (output: vscode.Uri) => {
                if (!(await uriIsEmptyDirectory(output))) {
                    return;
                }

                const result = await this._pacWrapper.packageInit(output.fsPath);
                if (result?.Status === "Success") {
                    vscode.window.showInformationMessage(result.Information[1].trim());
                } else {
                    vscode.window.showErrorMessage(result.Errors.join(os.EOL).trim());
                }
        }));

        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.explorer.solutionInit',
            async (output: vscode.Uri) => {
                if (!(await uriIsEmptyDirectory(output))) {
                    return;
                }

                const args = await solutionInitPrompt();
                const result = await this._pacWrapper.solutionInit(args.publisherName, args.publisherPrefix, output.fsPath);

                if (result?.Status === "Success") {
                    vscode.window.showInformationMessage(result.Information[1].trim());
                } else {
                    vscode.window.showErrorMessage(result.Errors.join(os.EOL).trim());
                }
        }));

        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.explorer.pcfInit',
            async (output: vscode.Uri) => {
                if (!(await uriIsEmptyDirectory(output))) {
                    return;
                }

                const args = await pcfInitPrompt();
                const result = await this._pacWrapper.pcfInit(args.namespace, args.name, args.template, output.fsPath);

                if (result?.Status === "Success") {
                    vscode.window.showInformationMessage(result.Information[1].trim());
                } else {
                    vscode.window.showErrorMessage(result.Errors.join(os.EOL).trim());
                }
        }));

        this._cmdDisposables.push(vscode.commands.registerCommand('pacCLI.explorer.pluginInit',
            async (output: vscode.Uri) => {
                if (!(await uriIsEmptyDirectory(output))) {
                    return;
                }

                const result = await this._pacWrapper.pluginInit(output.fsPath);

                if (result?.Status === "Success") {
                    vscode.window.showInformationMessage(result.Information[1].trim());
                } else {
                    vscode.window.showErrorMessage(result.Errors.join(os.EOL).trim());
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

async function uriIsEmptyDirectory(directory: vscode.Uri) : Promise<boolean> {
    if (directory.scheme !== 'file') {
        return false;
    }

    const directoryStats = await fs.stat(directory.fsPath);
    if (!directoryStats.isDirectory()) {
        return false;
    }

    const contents = await fs.promises.readdir(directory.fsPath);
    return !(contents && contents.length > 0);
}
