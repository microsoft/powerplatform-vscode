/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import * as fs from "fs-extra";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { BlockingQueue } from "../../common/utilities/BlockingQueue";
import { PacOutput, PacAdminListOutput, PacAuthListOutput, PacSolutionListOutput, PacOrgListOutput, PacOrgWhoOutput, PacAuthWhoOutput, PacPagesListOutput} from "./PacTypes";
import { v4 } from "uuid";
import { oneDSLoggerWrapper } from "../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

export interface IPacWrapperContext {
    readonly globalStorageLocalPath: string;
    readonly automationAgent: string;
    IsTelemetryEnabled(): boolean;
    GetCloudSetting(): string;
}

export interface IPacInterop {
    executeCommand(args: PacArguments): Promise<string>;
    exit(): void;
}

export class PacInterop implements IPacInterop {
    private _proc: ChildProcessWithoutNullStreams | undefined;
    private outputQueue = new BlockingQueue<string>();
    private tempWorkingDirectory: string;
    private pacExecutablePath: string;

    public constructor(private readonly context: IPacWrapperContext, cliPath: string) {
        // Set the Working Directory to a random temp folder, as we do not want
        // accidental writes by PAC being placed where they may interfere with things
        this.tempWorkingDirectory = path.join(os.tmpdir(), v4());
        fs.ensureDirSync(this.tempWorkingDirectory);
        this.pacExecutablePath = path.join(cliPath, PacInterop.getPacExecutableName());
    }

    private static getPacExecutableName(): string {
        const platformName = os.platform();
        switch (platformName) {
            case 'win32':
                return 'pac.exe';
            case 'darwin':
            case 'linux':
                return 'pac';
            default:
                throw new Error(`Unsupported OS platform for pac CLI: ${platformName}`);
        }
    }

    private async proc(): Promise<ChildProcessWithoutNullStreams> {
        if (!(this._proc)) {
            oneDSLoggerWrapper.getLogger().traceInfo('InternalPacProcessStarting');

            const env: NodeJS.ProcessEnv = { ...process.env, 'PP_TOOLS_AUTOMATION_AGENT': this.context.automationAgent };

            // If the VS Code telemetry is disabled, disable telemetry on the PAC backing the Extension's UI
            if (!this.context.IsTelemetryEnabled()) {
                env['PP_TOOLS_TELEMETRY_OPTOUT'] = 'true';
            }

            // Compatability for users on M1 Macs with .NET 6.0 installed - permit pac and pacTelemetryUpload
            // to roll up to 6.0 if 5.0 is not found on the system.
            if (os.platform() === 'darwin' && os.version().includes('ARM64')) {
                env['DOTNET_ROLL_FORWARD'] = 'Major';
            }

            this._proc = spawn(this.pacExecutablePath, ["--non-interactive"], {
                cwd: this.tempWorkingDirectory,
                env: env
            });

            const lineReader = readline.createInterface({ input: this._proc.stdout });
            lineReader.on('line', (line: string) => { this.outputQueue.enqueue(line); });

            // Grab the first output, which will be the PAC Version info
            await this.outputQueue.dequeue();
            oneDSLoggerWrapper.getLogger().traceInfo('InternalPacProcessStarted');
        }

        return this._proc;
    }

    public async executeCommand(args: PacArguments): Promise<string> {
        const command = JSON.stringify(args) + "\n";
        (await this.proc()).stdin.write(command);

        const result = await this.outputQueue.dequeue();
        return result;
    }

    public async exit(): Promise<void> {
        if (this._proc) {
            try {
                this._proc.stdin.write(JSON.stringify(new PacArguments("exit")));
                // Give the process a moment to exit gracefully
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch {
                // Ignore write errors, process might already be dead
            }

            // Force kill if still running
            if (this._proc && !this._proc.killed) {
                this._proc.kill();
            }

            // Clear the process reference so a new one will be created on next use
            this._proc = undefined;

            // Clear any pending queue items
            this.outputQueue = new BlockingQueue<string>();

            oneDSLoggerWrapper.getLogger().traceInfo('InternalPacProcessReset');
        }
    }
}

export class PacWrapper {
    public constructor(private readonly context: IPacWrapperContext, private readonly pacInterop: IPacInterop) {
    }

    private async executeCommandAndParseResults<T>(args: PacArguments): Promise<T> {
        const result = await this.pacInterop.executeCommand(args);
        const parsed: T = JSON.parse(result);
        return parsed;
    }

    public async authClear(): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("auth", "clear"));
    }

    public async authList(): Promise<PacAuthListOutput> {
        return this.executeCommandAndParseResults<PacAuthListOutput>(new PacArguments("auth", "list"));
    }

    public async authCreateNewAuthProfile(): Promise<PacAuthListOutput> {
        return this.executeCommandAndParseResults<PacAuthListOutput>(
            new PacArguments("auth", "create", "--cloud", this.context.GetCloudSetting()));
    }

    public async authCreateNewAuthProfileForOrg(orgUrl: string): Promise<PacAuthListOutput> {
        return this.executeCommandAndParseResults<PacAuthListOutput>(
            new PacArguments("auth", "create", "--url", orgUrl));
    }

    public async authSelectByIndex(index: number): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("auth", "select", "--index", index.toString()))
    }

    public async authDeleteByIndex(index: number): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("auth", "delete", "--index", index.toString()))
    }

    public async authNameByIndex(index: number, name: string): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("auth", "name", "--index", index.toString(), "--name", name))
    }

    // currently not called from anywhere
    public async adminEnvironmentList(): Promise<PacAdminListOutput> {
        return this.executeCommandAndParseResults<PacAdminListOutput>(new PacArguments("admin", "list"));
    }

    // currently not called from anywhere
    public async solutionList(): Promise<PacSolutionListOutput> {
        return this.executeCommandAndParseResults<PacSolutionListOutput>(new PacArguments("solution", "list"));
    }

    public async solutionListFromEnvironment(environmentUrl: string): Promise<PacSolutionListOutput> {
        return this.executeCommandAndParseResults<PacSolutionListOutput>(new PacArguments("solution", "list", "--environment", environmentUrl));
    }

    public async orgSelect(orgUrl: string): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("org", "select", "--environment", orgUrl));
    }

    public async orgList(): Promise<PacOrgListOutput> {
        return this.executeCommandAndParseResults<PacOrgListOutput>(new PacArguments("org", "list"));
    }

    public async activeOrg(): Promise<PacOrgWhoOutput> {
        return this.executeCommandAndParseResults<PacOrgWhoOutput>(new PacArguments("org", "who"));
    }

    public async activeAuth(): Promise<PacAuthWhoOutput> {
        return this.executeCommandAndParseResults<PacAuthWhoOutput>(new PacArguments("auth", "who"));
    }

    public async pcfInit(outputDirectory: string): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("pcf", "init", "--outputDirectory", outputDirectory));
    }

    public async enableTelemetry(): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("telemetry", "enable"));
    }

    public async disableTelemetry(): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("telemetry", "disable"));
    }

    public async pendingChanges(websitePath: string, dataModelVersion: 1 | 2): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("pages", "pending-changes", "-p", websitePath, "-mv", dataModelVersion.toString()));
    }

    public async downloadSite(downloadPath: string, websiteId: string, dataModelVersion: 1 | 2): Promise<PacOutput> {
        try {
            return await this.executeCommandAndParseResults<PacOutput>(new PacArguments("pages", "download", "-p", downloadPath, "-id", websiteId, "-mv", dataModelVersion.toString()));
        } catch (error) {
            // If download fails, reset the PAC CLI process to ensure it's in a clean state
            oneDSLoggerWrapper.getLogger().traceError(
                'PacDownloadError',
                'Download operation failed, resetting PAC CLI process',
                error instanceof Error ? error : new Error(String(error))
            );
            await this.resetPacProcess();
            throw error;
        }
    }

    public async resetPacProcess(): Promise<void> {
        try {
            await this.pacInterop.exit();
        } catch {
            // Ignore exit errors, process might already be dead
        }
        // The next operation will create a new process
    }

    public async pagesDownload(path: string, websiteId: string, modelVersion: string): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("pages", "download", "-p", path, "-id", websiteId, "-mv", modelVersion));
    }

    public async pagesList(): Promise<PacPagesListOutput> {
        return this.executeCommandAndParseResults<PacPagesListOutput>(new PacArguments("pages", "list", "--verbose"));
    }

    public exit(): void {
        this.pacInterop.exit();
    }
}

export class PacArguments {
    public Arguments: string[];

    constructor(...args: string[]) {
        this.Arguments = args;
    }
}
