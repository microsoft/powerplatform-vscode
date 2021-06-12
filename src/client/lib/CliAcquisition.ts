// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// https://code.visualstudio.com/api/extension-capabilities/common-capabilities#output-channel

import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as os from 'os';
import { Extract } from 'unzip-stream'
import  TelemetryClient from "../../common/telemetry/TelemetryClient";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const find = require('find-process');

// allow for DI without direct reference to vscode's d.ts file: that definintions file is being generated at VS Code runtime
export interface ICliAcquisitionContext {
    readonly extensionPath: string;
    readonly globalStorageLocalPath: string;
    readonly telemetryClient: TelemetryClient;
    showInformationMessage(message: string, ...items: string[]): void;
    showErrorMessage(message: string, ...items: string[]): void;
}

export interface IDisposable {
    dispose(): void;
}

export class CliAcquisition implements IDisposable {

    private readonly _context: ICliAcquisitionContext;
    private readonly _cliPath: string;
    private readonly _cliVersion: string;
    private readonly _nupkgsFolder: string;
    private readonly _installedTrackerFile: string;

    public get cliVersion(): string {
        return this._cliVersion;
    }

    public get cliExePath(): string {
        const execName = (os.platform() === 'win32') ? 'pac.exe' : 'pac';
        return path.join(this._cliPath, 'tools', execName);
    }

    public constructor(context: ICliAcquisitionContext, cliVersion?: string) {
        this._context = context;
        this._nupkgsFolder = path.join(this._context.extensionPath, 'dist', 'pac');
        this._cliVersion = cliVersion || this.getLatestNupkgVersion();
        // https://code.visualstudio.com/api/extension-capabilities/common-capabilities#data-storage
        this._cliPath = path.resolve(context.globalStorageLocalPath, 'pac');
        this._installedTrackerFile = path.resolve(context.globalStorageLocalPath, 'installTracker.json');
    }

    public dispose(): void {
        this._context.showInformationMessage('Bye');
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
        this._context.showInformationMessage(`Preparing pac CLI (v${this.cliVersion})...`);
        await this.killTelemetryProcess();
        fs.emptyDirSync(this._cliPath);
        return new Promise((resolve, reject) => {
            fs.createReadStream(pathToNupkg)
                .pipe(Extract({ path: this._cliPath }))
                .on('close', () => {
                    this._context.telemetryClient.trackEvent('PacCliInstalled', { cliVersion: this.cliVersion });
                    this._context.showInformationMessage('The pac CLI is ready for use in your VS Code terminal!');
                    if (os.platform() !== 'win32') {
                        fs.chmodSync(this.cliExePath, 0o755);
                    }
                    this.setInstalledVersion(this._cliVersion);
                    resolve(pacToolsPath);
                }).on('error', (err: unknown) => {
                    this._context.showErrorMessage(`Cannot install pac CLI: ${err}`);
                    reject(err);
                })
        });
    }

    isCliExpectedVersion(): boolean {
        const installedVersion = this.getInstalledVersion();
        if (!installedVersion) {
            return false;
        }
        return installedVersion === this._cliVersion;
    }

    async killTelemetryProcess(): Promise<void> {
        const list = await find('name', 'pacTelemetryUpload', true)
        list.forEach((info: { pid: number }) => {
            process.kill(info.pid)
        });
    }

    getLatestNupkgVersion(): string {
        const basename = this.getNupkgBasename();
        const nuPkgExtension = '.nupkg';

        const versions = glob.sync(`${basename}*${nuPkgExtension}`, { cwd: this._nupkgsFolder })
            .map(file => file.substring(basename.length + 1).slice(0, -nuPkgExtension.length))  // isolate version part of file name
            .filter(version => !isNaN(Number.parseInt(version.charAt(0))))  // expect version to start with number; dotnetCore and .NET pkg names share common base name
            .sort();
        if (versions.length < 1) {
            throw new Error(`Corrupt .vsix? Did not find any *.nupkg files under: ${this._nupkgsFolder}`);
        }
        return versions[0];
    }

    getNupkgBasename(): string {
        const platformName = os.platform();
        switch (platformName) {
            case 'win32':
                return 'microsoft.powerapps.cli';
            case 'darwin':
                return 'microsoft.powerapps.cli.core.osx-x64';
            case 'linux':
                return 'microsoft.powerapps.cli.core.linux-x64';
            default:
                throw new Error(`Unsupported OS platform for pac CLI: ${platformName}`);
        }
    }

    setInstalledVersion(version: string): void {
        const trackerInfo = {
            pac: version
        };
        fs.writeFileSync(this._installedTrackerFile, JSON.stringify(trackerInfo), 'utf-8');
    }

    getInstalledVersion(): string | undefined {
        if (!fs.existsSync(this._installedTrackerFile)) {
            return undefined;
        }
        try {
            const trackerInfo = JSON.parse(fs.readFileSync(this._installedTrackerFile, 'utf-8'));
            return trackerInfo.pac;
        }
        catch {
            return undefined;
        }
    }
}
