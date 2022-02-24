// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

import * as path from 'path';
import * as vscode from 'vscode';
import * as os from 'os'
import { PacInterop, PacWrapper, PacWrapperContext } from '../pac/PacWrapper';
import { ITelemetry } from '../telemetry/ITelemetry';
import { RegisterPanels } from './PacActivityBarUI';
import { buildAgentString } from '../telemetry/batchedTelemetryAgent';

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
        this._context.environmentVariableCollection.prepend('PAC_CLI_LAUNCHER_AGENT', buildAgentString(context));

        // Compatability for users on M1 Macs with .NET 6.0 installed - permit pac and pacTelemetryUpload
        // to roll up to 6.0 if 5.0 is not found on the system.
        if (os.platform() === 'darwin' && os.version().includes('ARM64')) {
            this._context.environmentVariableCollection.replace('DOTNET_ROLL_FORWARD','Major');
        }

        this._cmdDisposables.push(
            vscode.commands.registerCommand('pacCLI.openDocumentation', this.openDocumentation),
            vscode.commands.registerCommand('pacCLI.openPacLab', this.openPacLab));

        this._cmdDisposables.push(
            vscode.commands.registerCommand('pacCLI.pacHelp', () => PacTerminal.getTerminal().sendText("pac help")),
            vscode.commands.registerCommand('pacCLI.pacAuthHelp', () => PacTerminal.getTerminal().sendText("pac auth help")),
            vscode.commands.registerCommand('pacCLI.pacPackageHelp', () => PacTerminal.getTerminal().sendText("pac package help")),
            vscode.commands.registerCommand('pacCLI.pacPcfHelp', () => PacTerminal.getTerminal().sendText("pac pcf help")),
            vscode.commands.registerCommand('pacCLI.pacSolutionHelp', () => PacTerminal.getTerminal().sendText("pac solution help")));

        this._cmdDisposables.push(vscode.commands.registerCommand(`pacCLI.enableTelemetry`, async () => {
            const result = await this._pacWrapper.enableTelemetry();
            if (result?.Status === "Success") {
                vscode.window.showInformationMessage(localize("pacCLI.enableTelemetry.successMessage", "PAC Telemetry enabled"));
            } else {
                vscode.window.showErrorMessage(localize("pacCLI.enableTelemetry.failureMessage", "Failed to enable PAC telemetry."));
            }
        }));

        this._cmdDisposables.push(vscode.commands.registerCommand(`pacCLI.disableTelemetry`, async () => {
            const result = await this._pacWrapper.disableTelemetry();
            if (result?.Status === "Success") {
                vscode.window.showInformationMessage(localize("pacCLI.disableTelemetry.successMessage", "PAC Telemetry disabled"));
            } else {
                vscode.window.showErrorMessage(localize("pacCLI.disableTelemetry.failureMessage", "Failed to disable PAC telemetry."));
            }
        }));

        this._cmdDisposables.push(...RegisterPanels(this._pacWrapper));
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
