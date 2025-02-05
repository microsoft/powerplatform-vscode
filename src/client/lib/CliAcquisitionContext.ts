/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export interface ICliAcquisitionContext {
    readonly extensionPath: string;
    readonly globalStorageLocalPath: string;
    showInformationMessage(message: string, ...items: string[]): void;
    showErrorMessage(message: string, ...items: string[]): void;
    showCliPreparingMessage(version: string): void;
    showCliReadyMessage(): void;
    showCliInstallFailedError(err: string): void;
    locDotnetNotInstalledOrInsufficient(): string;
}

// allow for DI without direct reference to vscode's d.ts file: that definintions file is being generated at VS Code runtime
export class CliAcquisitionContext implements ICliAcquisitionContext {
    public constructor(
        private readonly _context: vscode.ExtensionContext,
    ) { }

    public get extensionPath(): string {
        return this._context.extensionPath;
    }
    public get globalStorageLocalPath(): string {
        return this._context.globalStorageUri.fsPath;
    }

    showInformationMessage(message: string, ...items: string[]): void {
        vscode.window.showInformationMessage(message, ...items);
    }

    showErrorMessage(message: string, ...items: string[]): void {
        vscode.window.showErrorMessage(message, ...items);
    }

    showCliPreparingMessage(version: string): void {
        vscode.window.showInformationMessage(
            vscode.l10n.t({
                message: "Preparing pac CLI (v{0})...",
                args: [version],
                comment: ["{0} represents the version number"]
            })
        );
    }

    showCliReadyMessage(): void {
        vscode.window.showInformationMessage(
            vscode.l10n.t('The pac CLI is ready for use in your VS Code terminal!'));
    }

    showCliInstallFailedError(err: string): void {
        vscode.window.showErrorMessage(
            vscode.l10n.t({
                message: "Cannot install pac CLI: {0}",
                args: [err],
                comment: ["{0} represents the error message returned from the exception"]
            })
        );
    }

    showGeneratorInstallingMessage(version: string): void {
        vscode.window.showInformationMessage(
            vscode.l10n.t({
                message: "Installing Power Pages generator(v{0})...",
                args: [version],
                comment: ["{0} represents the version number"]
            }))
    }

    locDotnetNotInstalledOrInsufficient(): string {
        return vscode.l10n.t({
            message: "dotnet sdk 6.0 or greater must be installed",
            comment: ["Do not translate 'dotnet' or 'sdk'"]
        });
    }
}
