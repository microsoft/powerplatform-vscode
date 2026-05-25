/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from 'path';
import * as vscode from 'vscode';
import * as os from 'os'
import { PacInterop, PacWrapper } from '../pac/PacWrapper';
import { PacWrapperContext } from '../pac/PacWrapperContext';
import { RegisterUriHandler } from '../uriHandler/uriHandler';

export class PacTerminal implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _cmdDisposables: vscode.Disposable[] = [];
    private readonly _pacWrapper: PacWrapper;

    public dispose(): void {
        this._cmdDisposables.forEach(cmd => cmd.dispose());
    }

    public constructor(context: vscode.ExtensionContext, cliPath: string) {
        this._context = context;
        const pacContext = new PacWrapperContext(context);
        const interop = new PacInterop(pacContext, cliPath);
        this._pacWrapper = new PacWrapper(pacContext, interop);

        // https://code.visualstudio.com/api/references/vscode-api#EnvironmentVariableCollection
        this._context.environmentVariableCollection.prepend('PATH', cliPath + path.delimiter);

        // Compatability for users on M1 Macs with .NET 6.0 installed - permit pac and pacTelemetryUpload
        // to roll up to 6.0 if 5.0 is not found on the system.
        if (os.platform() === 'darwin' && os.version().includes('ARM64')) {
            this._context.environmentVariableCollection.replace('DOTNET_ROLL_FORWARD', 'Major');
        }

        this._cmdDisposables.push(
            vscode.commands.registerCommand('pacCLI.openDocumentation', this.openDocumentation),
            vscode.commands.registerCommand('pacCLI.openPacLab', this.openPacLab));

        this._cmdDisposables.push(
            vscode.commands.registerCommand('pacCLI.pacHelp', () => PacTerminal.getTerminal().sendText("pac help")),
            vscode.commands.registerCommand('pacCLI.pacAuthHelp', () => PacTerminal.getTerminal().sendText("pac auth help")),
            vscode.commands.registerCommand('pacCLI.pacPackageHelp', () => PacTerminal.getTerminal().sendText("pac package help")),
            vscode.commands.registerCommand('pacCLI.pacPcfHelp', () => PacTerminal.getTerminal().sendText("pac pcf help")),
            vscode.commands.registerCommand('pacCLI.pacSolutionHelp', () => PacTerminal.getTerminal().sendText("pac solution help")),
            vscode.commands.registerCommand('pacCLI.pacAuthCreate', (orgUrl) => PacTerminal.getTerminal().sendText("pac auth create -u " + orgUrl)),
            vscode.commands.registerCommand('pacCLI.pacPaportalDownload', (websiteId) => PacTerminal.getTerminal().sendText(`pac paportal download -id ${websiteId} -p . -o`)));

        this._cmdDisposables.push(vscode.commands.registerCommand(`pacCLI.enableTelemetry`, async () => {
            const result = await this._pacWrapper.enableTelemetry();
            if (result?.Status === "Success") {
                vscode.window.showInformationMessage(vscode.l10n.t("PAC Telemetry enabled"));
            } else {
                vscode.window.showErrorMessage(vscode.l10n.t("Failed to enable PAC telemetry."));
            }
        }));

        this._cmdDisposables.push(vscode.commands.registerCommand(`pacCLI.disableTelemetry`, async () => {
            const result = await this._pacWrapper.disableTelemetry();
            if (result?.Status === "Success") {
                vscode.window.showInformationMessage(vscode.l10n.t("PAC Telemetry disabled"));
            } else {
                vscode.window.showErrorMessage(vscode.l10n.t("Failed to disable PAC telemetry."));
            }
        }));

        this._cmdDisposables.push(RegisterUriHandler(this._pacWrapper));
    }

    public openDocumentation(): void {
        vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/pacvscodedocs'));
    }

    public openPacLab(): void {
        vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/powerplatform-vscode-lab'));
    }

    public static getTerminal(): vscode.Terminal {
        const terminal = vscode.window.activeTerminal ?
            vscode.window.activeTerminal as vscode.Terminal :
            vscode.window.createTerminal();
        terminal.show();
        return terminal;
    }

    public getWrapper() {
        return this._pacWrapper
    }
}
