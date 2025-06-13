/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// https://code.visualstudio.com/api/extension-capabilities/common-capabilities#output-channel

import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as os from 'os';
import { Extract } from 'unzip-stream'
import find from 'find-process';
import { spawnSync } from 'child_process';
import commandExists from 'command-exists';
import { oneDSLoggerWrapper } from '../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { ICliAcquisitionContext } from './CliAcquisitionContext';

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
        return this.installCli(path.join(this._context.extensionPath, 'dist', 'pac'), basename);
    }

    async installCli(nupkgDirectory: string, packageName: string): Promise<string> {
        const useDotnetTool = packageName.endsWith('.tool');

        const pacExeDirectory = useDotnetTool
            ? this._cliPath
            : path.join(this._cliPath, 'tools');

        if (this.isCliExpectedVersion()) {
            return Promise.resolve(pacExeDirectory);
        }

        // nupkg has not been installed yet:
        this._context.showCliPreparingMessage(this.cliVersion);
        await this.killProcessesInUse(this._cliPath);
        fs.emptyDirSync(this._cliPath);

        if (useDotnetTool) {
            // install pac via `dotnet tool install`
            return new Promise((resolve, reject) => {
                // Check if dotnet is installed
                if (!commandExists.sync('dotnet')) {
                    const error = this._context.locDotnetNotInstalledOrInsufficient();
                    this._context.showCliInstallFailedError(error);
                    reject(error);
                    return;
                }

                const install = spawnSync(
                    "dotnet",
                    ["tool", "install", "Microsoft.PowerApps.CLI.Tool", "--tool-path", this._cliPath, "--add-source", nupkgDirectory, "--version", this.cliVersion],
                    { encoding: "utf-8" });

                if (install.status != 0) {
                    oneDSLoggerWrapper.getLogger().traceError(
                        'PacInstallError',
                        'PacInstallError',
                        { name: 'PacInstallError', message: 'PacInstallError' } as Error,
                        { "stdout": install.stdout, "stderr": install.stderr }
                    );

                    // NU1202 - dotnet is installed, but version is incommpatible with the tool
                    const dotnetIncompatible = install.stdout.includes("NU1202") || install.stderr.includes("NU1202");

                    const errorMessage = dotnetIncompatible
                        ? this._context.locDotnetNotInstalledOrInsufficient()
                        : install.stderr;

                    this._context.showCliInstallFailedError(errorMessage);
                    reject(errorMessage);
                } else {
                    oneDSLoggerWrapper.getLogger().traceInfo('PacCliInstalled', { cliVersion: this.cliVersion });
                    this._context.showCliReadyMessage();
                    this.setInstalledVersion(this._cliVersion);
                    resolve(pacExeDirectory);
                }
            });
        } else {
            // "install" pac via unzipping the nuget package
            const pathToNupkg = path.join(nupkgDirectory, `${packageName}.${this.cliVersion}.nupkg`)
            return new Promise((resolve, reject) => {
                fs.createReadStream(pathToNupkg)
                    .pipe(Extract({ path: this._cliPath }))
                    .on('close', () => {
                        oneDSLoggerWrapper.getLogger().traceInfo('PacCliInstalled', { cliVersion: this.cliVersion });
                        this._context.showCliReadyMessage();
                        if (os.platform() !== 'win32') {
                            fs.chmodSync(this.cliExePath, 0o755);
                        }
                        this.setInstalledVersion(this._cliVersion);
                        resolve(pacExeDirectory);
                    }).on('error', (err: unknown) => {
                        this._context.showCliInstallFailedError(String(err));
                        reject(err);
                    })
            });
        }
    }

    isCliExpectedVersion(): boolean {
        const installedVersion = this.getInstalledVersion();
        if (!installedVersion) {
            return false;
        }
        return installedVersion === this._cliVersion;
    }

    async killProcessesInUse(pacInstallPath: string): Promise<void> {
        const list = await this.findPacProcesses(pacInstallPath);
        list.forEach(info => process.kill(info.pid));
    }

    async findPacProcesses(pacInstallPath: string): Promise<{ pid: number, cmd: string }[]> {
        try {
            // In most cases, find-process will handle the OS specifics to find the running
            // Pac and PacTelemetryUpload processes
            const processes = (await find('name', 'pac', true))
                .concat(await find('name', 'pacTelemetryUpload', false)); // strict = false, as this may either be 'pacTelemetryProcess' or 'dotnet pacTelemetryProcess.dll'

            // VS Code Install path and find-process disagree on the casing of "C:\" on Windows
            return processes.filter(info => (os.platform() === 'win32')
                ? info.cmd.toLowerCase().includes(pacInstallPath.toLowerCase())
                : info.cmd.includes(pacInstallPath));
        } catch (err) {
            // find-process fails with the WSL remoting pseudo terminal, so we'll need to call 'ps' ourselves
            if (typeof err === "string" && err.includes("screen size is bogus") && os.platform() === "linux") {
                const psResult = spawnSync("ps", ["ax", "-ww", "-o", "pid,args"], { encoding: "utf-8" });

                // Output is a single '\n' delimated string.  First row is a header, the rest are in
                // the format [optional left padding spaces][PID][single space][full command line arguments of the running process]
                const processes = psResult.stdout.split(os.EOL)
                    .filter(line => line && line.includes(pacInstallPath))
                    .map(line => line.trimStart())
                    .map(line => line.split(' ', 2))
                    .map(split => ({ pid: parseInt(split[0]), cmd: split[1] }));

                return processes;
            }

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
                return 'microsoft.powerapps.cli.tool';
            case 'linux':
                return 'microsoft.powerapps.cli.tool';
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
