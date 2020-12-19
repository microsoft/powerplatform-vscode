// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// https://code.visualstudio.com/api/extension-capabilities/common-capabilities#output-channel

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Extract } from 'unzip-stream'

export class AcquireCli implements vscode.Disposable {

    private readonly _context: vscode.ExtensionContext;
    private readonly _cliPath: string;
    private readonly _cliVersion: string;

    public get cliVersion() : string {
        return this._cliVersion;
    }

    public constructor(context: vscode.ExtensionContext, cliVersion: string) {
        this._context = context;
        this._cliVersion = cliVersion;
        // https://code.visualstudio.com/api/extension-capabilities/common-capabilities#data-storage
        this._cliPath = path.resolve(context.globalStorageUri.fsPath, 'pac');
    }

    public dispose(): void {
        vscode.window.showInformationMessage('Bye');
    }

    public async ensureInstalled(): Promise<string> {
        return this.installCli(path.join(this._context.extensionPath, 'out', 'pac', `microsoft.powerapps.cli.${this.cliVersion}.nupkg`));
    }

    async installCli(pathToNupkg: string): Promise<string> {
        const pacToolsPath = path.join(this._cliPath, 'tools');
        if (fs.existsSync(path.join(pacToolsPath, 'pac.exe'))) {
            return Promise.resolve(pacToolsPath);
        }
        // nupkg has not been extracted yet:
        vscode.window.showInformationMessage(`Preparing pac CLI (v${this.cliVersion})...`);
        return new Promise((resolve, reject) => {
            fs.createReadStream(pathToNupkg)
                .pipe(Extract({ path: this._cliPath }))
                .on('close', () => {
                    vscode.window.showInformationMessage('The pac CLI is ready for use in your VS Code terminal!');
                    resolve(pacToolsPath);
                }).on('error', (err: unknown) => {
                    vscode.window.showErrorMessage(`Cannot install pac CLI: ${err}`);
                    reject(err);
                })
        });

    }
}
