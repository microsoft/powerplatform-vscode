// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// https://code.visualstudio.com/api/extension-capabilities/common-capabilities#output-channel

import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as os from 'os';
import { Extract } from 'unzip-stream'
import { ITelemetry } from '../telemetry/ITelemetry';
import find from 'find-process';
import { spawnSync } from 'child_process';

// allow for DI without direct reference to vscode's d.ts file: that definintions file is being generated at VS Code runtime
export interface ICliAcquisitionContext {
    readonly extensionPath: string;
    readonly globalStorageLocalPath: string;
    readonly telemetry: ITelemetry;
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
        // if (this.isCliExpectedVersion()) {
        //     return Promise.resolve(pacToolsPath);
        // }
        // nupkg has not been extracted yet:
        this._context.showInformationMessage(`Preparing pac CLI (v${this.cliVersion})...`);
        this._context.showInformationMessage("CliAcquisition.installCli() - killing processes");
        await this.killProcessesInUse(pacToolsPath);
        this._context.showInformationMessage("CliAcquisition.installCli() - killed processes");
        this._context.showInformationMessage("CliAcquisition.installCli() - dir sync start");
        fs.emptyDirSync(this._cliPath);
        this._context.showInformationMessage("CliAcquisition.installCli() - dir sync end");
        return new Promise((resolve, reject) => {
            fs.createReadStream(pathToNupkg)
                .pipe(Extract({ path: this._cliPath }))
                .on('close', () => {
                    this._context.showInformationMessage("CliAcquisition.installCli() - Pac CLI installed");
                    this._context.telemetry.sendTelemetryEvent('PacCliInstalled', { cliVersion: this.cliVersion });
                    this._context.showInformationMessage('The pac CLI is ready for use in your VS Code terminal!');
                    if (os.platform() !== 'win32') {
                        fs.chmodSync(this.cliExePath, 0o755);
                    }
                    this.setInstalledVersion(this._cliVersion);
                    resolve(pacToolsPath);
                }).on('error', (err: unknown) => {
                    this._context.showInformationMessage(`CliAcquisition.installCli() - Install Error ${err}`);
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

    async killProcessesInUse(pacInstallPath: string): Promise<void> {

        this._context.showInformationMessage("CliAcquisition.killProcessesInUse() - Searching for processes");
        const tel = await this.findProcessWithRetry(pacInstallPath, 'pacTelemetryUpload');
        const pac = await this.findProcessWithRetry(pacInstallPath, 'pac');
        this._context.showInformationMessage("CliAcquisition.killProcessesInUse() - PAC Processes search done");
        const list = tel.concat(pac);

        const debugOutput = list.map(info => `PID: ${info.pid}\tcmd: ${info.cmd}`).join("\n\t");
        this._context.showInformationMessage(`CliAcquisition.killProcessesInUse() - Processes found:\n\t${debugOutput}`)

        //const list = (await find('name', 'pacTelemetryUpload', true)).concat(await find('name', 'pac', true));
        this._context.showInformationMessage(`CliAcquisition.killProcessesInUse() - Found processes ${list}`);
        list.forEach(info => process.kill(info.pid));
    }

    async findProcessWithRetry(pacInstallPath: string, procName: string): Promise<{pid: number, cmd: string, ppid?: number|undefined, uid?: number|undefined, gid?: number|undefined}[]> {
        try {
            this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - Attempt find-process ${procName}`);
            const processes = await find('name', procName, true);
            this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - Attempt find-process ${procName} - Success!`);
            return processes.filter(info => info.cmd.includes(pacInstallPath));
        } catch (err) {
            this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - Attempt find-process ${procName} - Fail!  Error was ${err}`);

            // TODO - Guard on error including "screen size is bogus", and Linux OS check
            if (typeof err === "string" && err.includes("screen size is bogus")) {

                try {
                    this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - Explicit PS attempt [${procName}] in location [${pacInstallPath}]`);
                    const psResult = spawnSync("ps", ["ax","-ww","-o","pid,args"]);
                    if (psResult.error) {
                        this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - Explicit PS attempt ${procName} - Error: ${psResult.error}`);
                    }

                    const foo = psResult.output
                        .filter(chunk => chunk)
                        .map((chunk: string) => chunk.split("\n"))
                        .reduce((accumulator, current) => accumulator.concat(current), [])
                        .filter(line => line);
                    this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - lines: ${foo?.length ?? -1} foo: ${foo}`);
                    //const foo1 = foo.filter(line => line && line.includes(path.join(pacInstallPath, procName)));
                    const foo1 = foo.filter(line => line && line.includes(pacInstallPath));
                    this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - lines: ${foo1?.length ?? -1} foo1: ${foo1?.join("\n")}`);
                    const foo2 = foo1.map(line => {
                        this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - type before trim: ${typeof line}`);
                        return line.trim();
                    });
                    this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - lines: ${foo2?.length ?? -1} foo2: ${foo2?.join("\n")}`);
                    const foo3 = foo2.map(line => line.split(' ', 1));
                    this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - foo3: ${foo3}`);
                    const foo4 = foo3.map(split => ({pid: parseInt(split[0]), cmd: split[1]}));
                    this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - foo4: ${foo4}`);

                    // const processes = psResult.output
                    //     .filter(line => line && line.includes(path.join(pacInstallPath, procName)))
                    //     .map(line => line.trim())
                    //     .map(line => line.split(' ', 1))
                    //     .map(split => ({pid: parseInt(split[0]), cmd: split[1]}));

                    // return processes;
                    return [];// foo4
                } catch (retryErr) {
                    this._context.showInformationMessage(`CliAcquisition.findProcessWithRetry() - failed on second attempt to find ${procName} with error ${retryErr}.`)
                    throw retryErr;
                }
            }

            this._context.showErrorMessage("Error finding processes");
            throw err;
        }
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

