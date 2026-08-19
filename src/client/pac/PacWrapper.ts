/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import * as fs from "fs-extra";
import * as vscode from "vscode";
import { ChildProcessWithoutNullStreams, spawn, SpawnOptionsWithoutStdio } from "child_process";
import { BlockingQueue } from "../../common/utilities/BlockingQueue";
import { PacOutput, PacAdminListOutput, PacAuthListOutput, PacSolutionListOutput, PacOrgListOutput, PacOrgWhoOutput, PacAuthWhoOutput } from "./PacTypes";
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
    executeCommandWithProgress(args: PacArguments, cancellationToken?: vscode.CancellationToken): Promise<boolean>;
    exit(): void;
    showOutputChannel(): void;
}

/**
 * A live `pac` child process paired with the promise that reports its death, so callers always
 * observe the failure signal belonging to the exact process they wrote their command to.
 */
interface RunningPacProcess {
    proc: ChildProcessWithoutNullStreams;
    /** Never resolves; rejects once the process exits or fails to start. */
    failure: Promise<never>;
}

/**
 * Spawns the long-lived `pac` child process. Injectable so the process lifecycle handling can be
 * exercised in tests without a real PAC executable.
 */
export type PacProcessSpawner = (
    command: string,
    args: string[],
    options: SpawnOptionsWithoutStdio) => ChildProcessWithoutNullStreams;

export class PacInterop implements IPacInterop {
    private _running: RunningPacProcess | undefined;
    private _recentStandardError = '';
    private outputQueue = new BlockingQueue<string>();
    private tempWorkingDirectory: string;
    private pacExecutablePath: string;
    private _outputChannel: vscode.LogOutputChannel | undefined;

    /** Upper bound on the buffered stderr text kept for diagnosing a process failure. */
    private static readonly MAX_BUFFERED_STANDARD_ERROR = 4096;

    public constructor(
        private readonly context: IPacWrapperContext,
        cliPath: string,
        private readonly spawnProcess: PacProcessSpawner = spawn) {
        // Set the Working Directory to a random temp folder, as we do not want
        // accidental writes by PAC being placed where they may interfere with things
        this.tempWorkingDirectory = path.join(os.tmpdir(), v4());
        fs.ensureDirSync(this.tempWorkingDirectory);
        this.pacExecutablePath = path.join(cliPath, PacInterop.getPacExecutableName());
    }

    private get outputChannel(): vscode.LogOutputChannel {
        if (!this._outputChannel) {
            this._outputChannel = vscode.window.createOutputChannel(vscode.l10n.t("Power Platform Tools: PAC CLI"), { log: true });
        }
        return this._outputChannel;
    }

    public static getPacExecutableName(): string {
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

    private async proc(): Promise<RunningPacProcess> {
        if (!(this._running)) {
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

            const proc = this.spawnProcess(this.pacExecutablePath, ["--non-interactive"], {
                cwd: this.tempWorkingDirectory,
                env: env
            });
            this._recentStandardError = '';

            const lineReader = readline.createInterface({ input: proc.stdout });
            lineReader.on('line', (line: string) => { this.outputQueue.enqueue(line); });

            // stderr is a pipe that nothing else consumes. Left undrained it fills, at which point
            // PAC blocks forever inside its write and stops producing stdout, so every pending and
            // future dequeue() hangs indefinitely (BlockingQueue never times out). Draining it keeps
            // the process alive and gives us the text to explain a failure with.
            proc.stderr.on('data', (data: Buffer) => { this.bufferStandardError(data.toString()); });

            // Without these, a PAC process that dies or fails to start leaves the reference in place,
            // so commands are written to a dead pipe and their dequeue() never settles.
            const failure = new Promise<never>((_resolve, reject) => {
                const fail = (reason: string) => {
                    this.handleProcessTermination(proc);
                    reject(new Error(reason));
                };
                proc.on('error', (error: Error) => fail(`PAC CLI process failed to start or crashed: ${error.message}`));
                proc.on('exit', (code: number | null, signal: NodeJS.Signals | null) =>
                    fail(this.describeUnexpectedExit(code, signal)));
            });
            // The process can die while no command is in flight; keep that from surfacing as an
            // unhandled rejection. Callers still observe it through the race in executeCommand.
            failure.catch(() => undefined);

            this._running = { proc, failure };

            // Grab the first output, which will be the PAC Version info
            await Promise.race([this.outputQueue.dequeue(), failure]);
            oneDSLoggerWrapper.getLogger().traceInfo('InternalPacProcessStarted');

            return { proc, failure };
        }

        return this._running;
    }

    /** Retains a bounded tail of PAC's stderr so a process failure can be reported with context. */
    private bufferStandardError(text: string): void {
        this._recentStandardError = (this._recentStandardError + text)
            .slice(-PacInterop.MAX_BUFFERED_STANDARD_ERROR);
    }

    private describeUnexpectedExit(code: number | null, signal: NodeJS.Signals | null): string {
        const cause = signal ? `signal ${signal}` : `exit code ${code}`;
        const details = this._recentStandardError.trim();
        return details
            ? `PAC CLI process ended unexpectedly (${cause}): ${details}`
            : `PAC CLI process ended unexpectedly (${cause}).`;
    }

    /**
     * Drops the state tied to a terminated process so the next command spawns a fresh one.
     * Ignores a process that has already been replaced, to avoid tearing down its successor.
     */
    private handleProcessTermination(terminated: ChildProcessWithoutNullStreams): void {
        if (this._running?.proc !== terminated) {
            return;
        }

        this._running = undefined;
        // Responses of in-flight commands will never arrive; a fresh queue keeps the next
        // process's output aligned with the callers waiting on it.
        this.outputQueue = new BlockingQueue<string>();
        oneDSLoggerWrapper.getLogger().traceInfo('InternalPacProcessTerminated');
    }

    public async executeCommand(args: PacArguments): Promise<string> {
        const command = JSON.stringify(args) + "\n";
        const { proc, failure } = await this.proc();
        proc.stdin.write(command);

        // Racing against process death turns "PAC went away" into an actionable error instead of a
        // promise that never settles and a progress notification that spins forever.
        const result = await Promise.race([this.outputQueue.dequeue(), failure]);
        return result;
    }

    public async exit(): Promise<void> {
        const running = this._running;
        if (running) {
            try {
                // PAC reads stdin line by line, so without the newline the exit command is never
                // seen and shutdown always falls through to the force kill below.
                running.proc.stdin.write(JSON.stringify(new PacArguments("exit")) + "\n");
                // Give the process a moment to exit gracefully
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch {
                // Ignore write errors, process might already be dead
            }

            // Force kill if still running
            if (!running.proc.killed) {
                running.proc.kill();
            }

            // Clear the process reference so a new one will be created on next use
            this._running = undefined;
            this._recentStandardError = '';

            // Clear any pending queue items
            this.outputQueue = new BlockingQueue<string>();

            oneDSLoggerWrapper.getLogger().traceInfo('InternalPacProcessReset');
        }
    }

    /**
     * Executes a PAC command with output streamed to a VS Code Output Channel.
     * This allows the user to see progress in real-time while still awaiting completion.
     *
     * When a {@link vscode.CancellationToken} is supplied and fires, the spawned
     * `pac` child process is killed and the returned promise resolves to `false`.
     * The promise is only resolved from the `close`/`error` handlers (never from
     * the cancellation callback itself), so callers can safely run cleanup code
     * — for example deleting temp directories — after the promise resolves
     * without racing the still-exiting child process.
     *
     * @param args The PAC command arguments
     * @param cancellationToken Optional token used to abort the running command
     * @returns Promise that resolves to true if command succeeded, false on failure or cancellation
     */
    public async executeCommandWithProgress(args: PacArguments, cancellationToken?: vscode.CancellationToken): Promise<boolean> {
        const command = `pac ${args.Arguments.join(" ")}`;

        this.outputChannel.info(vscode.l10n.t("Executing: {0}", command));

        // Honor a token that is already cancelled before we spawn — avoids
        // launching a process the caller doesn't actually want.
        if (cancellationToken?.isCancellationRequested) {
            this.outputChannel.info(vscode.l10n.t("Command cancelled before start."));
            return false;
        }

        return new Promise((resolve) => {
            const env: NodeJS.ProcessEnv = { ...process.env, 'PP_TOOLS_AUTOMATION_AGENT': this.context.automationAgent };

            //TODO: Enable this when PAC CLI issue is fixed
            // if (!this.context.IsTelemetryEnabled()) {
            //     env['PP_TOOLS_TELEMETRY_OPTOUT'] = 'true';
            // }

            if (os.platform() === 'darwin' && os.version().includes('ARM64')) {
                env['DOTNET_ROLL_FORWARD'] = 'Major';
            }

            const proc = spawn(this.pacExecutablePath, args.Arguments, {
                cwd: this.tempWorkingDirectory,
                env: env,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Track cancellation + completion separately so the close/error
            // handlers can produce the right message and we never resolve twice.
            // The `pac` subcommands invoked through this method (pages
            // download/clone/upload/...) run as a single .NET process and do
            // not spawn child processes, so killing the direct PID is enough
            // on both Windows and Unix.
            let settled = false;
            let cancelled = false;
            const finalize = (result: boolean) => {
                if (settled) {
                    return;
                }
                settled = true;
                cancellationListener?.dispose();
                resolve(result);
            };

            const cancellationListener = cancellationToken?.onCancellationRequested(() => {
                if (settled) {
                    return;
                }
                cancelled = true;
                try {
                    proc.kill();
                } catch {
                    // Process may already have exited; close handler will run finalize.
                }
            });

            proc.stdout?.on('data', (data: Buffer) => {
                const output = data.toString().trim();
                if (output) {
                    this.outputChannel.info(output);
                }
            });

            proc.stderr?.on('data', (data: Buffer) => {
                const output = data.toString().trim();
                if (output) {
                    this.outputChannel.warn(output);
                }
            });

            proc.on('close', (code: number) => {
                if (cancelled) {
                    this.outputChannel.info(vscode.l10n.t("Command cancelled."));
                    finalize(false);
                    return;
                }
                if (code === 0) {
                    this.outputChannel.info(vscode.l10n.t("Command completed successfully."));
                    finalize(true);
                } else {
                    this.outputChannel.error(vscode.l10n.t("Command failed with exit code: {0}", code.toString()));
                    finalize(false);
                }
            });

            proc.on('error', (error: Error) => {
                this.outputChannel.error(vscode.l10n.t("Process error: {0}", error.message));
                finalize(false);
            });
        });
    }

    /**
     * Shows the PAC CLI output channel to the user.
     * Call this method when you want to display command output to the user.
     */
    public showOutputChannel(): void {
        this.outputChannel.show();
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

    /**
     * Downloads a site with output streamed to a VS Code Output Channel.
     * This allows the user to see progress in real-time while still awaiting completion.
     * @param downloadPath Path to download to
     * @param websiteId Website ID
     * @param dataModelVersion Data model version (1 or 2)
     * @param environmentUrl Optional environment URL for cross-environment downloads
     * @param includeEntities Optional array of entity names to include for selective download
     * @returns Promise that resolves to true if download succeeded, false otherwise
     */
    public async downloadSiteWithProgress(
        downloadPath: string,
        websiteId: string,
        dataModelVersion: 1 | 2,
        environmentUrl?: string,
        includeEntities?: string[],
        cancellationToken?: vscode.CancellationToken
    ): Promise<boolean> {
        const pacArguments = ["pages", "download", "--path", downloadPath, "--webSiteId", websiteId, "--modelVersion", dataModelVersion.toString(), "--overwrite"];

        if (environmentUrl) {
            pacArguments.push("--environment", environmentUrl);
        }

        if (includeEntities && includeEntities.length > 0) {
            pacArguments.push("--includeEntities", includeEntities.join(","));
        }

        return this.pacInterop.executeCommandWithProgress(
            new PacArguments(...pacArguments),
            cancellationToken
        );
    }

    /**
     * Downloads a code site with output streamed to a VS Code Output Channel.
     * This allows the user to see progress in real-time while still awaiting completion.
     * @param downloadPath Path to download to
     * @param websiteId Website ID
     * @param environmentUrl Optional environment URL
     * @returns Promise that resolves to true if download succeeded, false otherwise
     */
    public async downloadCodeSiteWithProgress(
        downloadPath: string,
        websiteId: string,
        environmentUrl?: string,
        cancellationToken?: vscode.CancellationToken
    ): Promise<boolean> {
        const pacArguments = ["pages", "download-code-site", "--path", downloadPath, "--webSiteId", websiteId, "--overwrite"];

        if (environmentUrl) {
            pacArguments.push("--environment", environmentUrl);
        }

        return this.pacInterop.executeCommandWithProgress(
            new PacArguments(...pacArguments),
            cancellationToken
        );
    }

    /**
     * Clones a site with output streamed to a VS Code Output Channel.
     * @param sourcePath Path of the website content to clone
     * @param outputDirectory Path where the cloned content will be saved
     * @param name Name for the cloned site
     * @returns Promise that resolves to true if clone succeeded, false otherwise
     */
    public async cloneSiteWithProgress(
        sourcePath: string,
        outputDirectory: string,
        name: string,
        cancellationToken?: vscode.CancellationToken
    ): Promise<boolean> {
        const pacArguments = ["pages", "clone", "--path", sourcePath, "--outputDirectory", outputDirectory, "--name", name, "--overwrite"];

        return this.pacInterop.executeCommandWithProgress(
            new PacArguments(...pacArguments),
            cancellationToken
        );
    }

    /**
     * Uploads a site with output streamed to a VS Code Output Channel.
     * @param uploadPath Path from where the site content is uploaded
     * @param modelVersion Data model version
     * @returns Promise that resolves to true if upload succeeded, false otherwise
     */
    public async uploadSiteWithProgress(
        uploadPath: string,
        modelVersion: string,
        cancellationToken?: vscode.CancellationToken
    ): Promise<boolean> {
        const pacArguments = ["pages", "upload", "--path", uploadPath, "--modelVersion", modelVersion];

        return this.pacInterop.executeCommandWithProgress(
            new PacArguments(...pacArguments),
            cancellationToken
        );
    }

    /**
     * Uploads a code site with output streamed to a VS Code Output Channel.
     * @param rootPath Root source folder of the code site
     * @param siteName Name of the site
     * @returns Promise that resolves to true if upload succeeded, false otherwise
     */
    public async uploadCodeSiteWithProgress(
        rootPath: string,
        siteName: string,
        cancellationToken?: vscode.CancellationToken
    ): Promise<boolean> {
        const pacArguments = ["pages", "upload-code-site", "--rootPath", rootPath, "--siteName", siteName];

        return this.pacInterop.executeCommandWithProgress(
            new PacArguments(...pacArguments),
            cancellationToken
        );
    }

    public async resetPacProcess(): Promise<void> {
        try {
            await this.pacInterop.exit();
        } catch {
            // Ignore exit errors, process might already be dead
        }
        // The next operation will create a new process
    }

    /**
     * Shows the PAC CLI output channel to the user.
     * Call this method when you want to display command output to the user.
     */
    public showOutputChannel(): void {
        this.pacInterop.showOutputChannel();
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
