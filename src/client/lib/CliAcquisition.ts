// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// https://code.visualstudio.com/api/extension-capabilities/common-capabilities#output-channel

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { Extract } from 'unzip-stream'
import { execSync } from 'child_process';
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
        const execName = (os.platform() === 'win32') ? 'pac.exe' : 'pac';
        return path.join(this._cliPath, 'tools', execName);
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
        const basename = this.getNupkgBasename();
        return this.installCli(path.join(this._context.extensionPath, 'dist', 'pac', `${basename}.${this.cliVersion}.nupkg`));
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
                    if (os.platform() !== 'win32') {
                        fs.chmodSync(this.cliExePath, 0o755);
                    }
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
        let versionMatch;
        try {
            const res = execSync(`"${exePath}" help`, { encoding: 'utf-8' });
            versionMatch = res.match(/Version:\s+(\S+)/);
        }
        catch {
            return false;
        }
        // TODO: version string between net462 and dotnetCore differ: latter has git commit id -> homogenize versions
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

    getNupkgBasename(): string {
        const platformName = os.platform();
        switch (platformName) {
            case 'win32':
                return 'microsoft.powerapps.cli';
            case 'darwin':
                return 'microsoft.powerapps.cli.Core.osx-x64';
            case 'linux':
                return 'microsoft.powerapps.cli.Core.linux-x64';
            default:
                throw new Error(`Unsupported OS platform for pac CLI: ${platformName}`);
        }
    }
}
