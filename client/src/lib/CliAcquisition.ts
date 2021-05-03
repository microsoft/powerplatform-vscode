// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// https://code.visualstudio.com/api/extension-capabilities/common-capabilities#output-channel

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Extract } from 'unzip-stream'
import { spawnSync } from 'child_process';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const find = require('find-process');

export class CliAcquisition implements vscode.Disposable {

    private readonly _context: vscode.ExtensionContext;
    private readonly _cliPath: string;
    private readonly _cliVersion: string;

    public get cliVersion() : string {
        return this._cliVersion;
    }

    public get cliExePath() : string {
        return path.join(this._cliPath, 'tools', 'pac.exe');
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
        return this.installCli(path.join(this._context.extensionPath, 'dist', 'pac', `microsoft.powerapps.cli.${this.cliVersion}.nupkg`));
    }

    async installCli(pathToNupkg: string): Promise<string> {
        const pacToolsPath = path.join(this._cliPath, 'tools');
        if (this.isCliExpectedVersion()) {
            return Promise.resolve(pacToolsPath);
        }
        // nupkg has not been extracted yet:
        vscode.window.showInformationMessage(`Preparing pac CLI (v${this.cliVersion})...`);
        await this.killTelemetryProcess();
        fs.emptyDirSync(this._cliPath);
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

    isCliExpectedVersion(): boolean {
        const exePath = this.cliExePath;
        if (!fs.existsSync(exePath)) {
            return false;
        }
        // determine version of currently cached CLI:
        const res = spawnSync(exePath, ['help'], { encoding: 'utf-8' });
        if (res.status !== 0) {
            return false;
        }
        const versionMatch = res.stdout.match(/Version:\s+(\S+)/);
        if (versionMatch && versionMatch.length >= 2) {
            return (versionMatch[1] === this._cliVersion);
        }
        return false;
    }

    async killTelemetryProcess(): Promise<void> {
        const list = await find('name', 'pacTelemetryUpload', true)
        list.forEach((info: {pid: number}) => {
            process.kill(info.pid)
        });
    }
}
