// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import * as vscode from "vscode";
import * as fs from "fs-extra";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { BlockingQueue } from "../../common/utilities/BlockingQueue";
import { ITelemetry } from "../telemetry/ITelemetry";
import { PacOutput, PacAdminListOutput, PacAuthListOutput, PacSolutionListOutput } from "./PacTypes";
import { v4 } from "uuid";

export interface IPacWrapperContext {
    readonly globalStorageLocalPath: string;
    readonly telemetry: ITelemetry;
}

export class PacWrapperContext implements IPacWrapperContext {
    public constructor(
        private readonly _context: vscode.ExtensionContext,
        private readonly _telemetry: ITelemetry) {
    }
    public get globalStorageLocalPath(): string { return this._context.globalStorageUri.fsPath; }
    public get telemetry(): ITelemetry { return this._telemetry; }
}


export interface IPacInterop {
    executeCommand(args: PacArguments): Promise<string>;
    exit(): void;
}

export class PacInterop implements IPacInterop {
    private _proc : ChildProcessWithoutNullStreams | undefined;
    private outputQueue = new BlockingQueue<string>();
    private tempWorkingDirectory : string;
    private pacExecutablePath : string;

    public constructor(private readonly context: IPacWrapperContext) {
        // Set the Working Directory to a random temp folder, as we do not want
        // accidental writes by PAC being placed where they may interfere with things
        this.tempWorkingDirectory = path.join(os.tmpdir(), v4());
        fs.ensureDirSync(this.tempWorkingDirectory);
        this.pacExecutablePath = path.join(this.context.globalStorageLocalPath, 'pac', 'tools', PacInterop.getPacExecutableName());
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

    private async proc() : Promise<ChildProcessWithoutNullStreams> {
        if (!(this._proc)) {
            this.context.telemetry.sendTelemetryEvent('InternalPacProcessStarting');
            this._proc = spawn(this.pacExecutablePath, ["--non-interactive"], {
                cwd: this.tempWorkingDirectory,
                });

            const lineReader = readline.createInterface({ input: this._proc.stdout });
            lineReader.on('line', (line: string) => { this.outputQueue.enqueue(line); });

            // Grab the first output, which will be the PAC Version info
            await this.outputQueue.dequeue();
            this.context.telemetry.sendTelemetryEvent('InternalPacProcessStarted');
        }

        return this._proc;
    }

    public async executeCommand(args: PacArguments): Promise<string> {
        const command = JSON.stringify(args) + "\n";
        (await this.proc()).stdin.write(command);

        const result = await this.outputQueue.dequeue();
        return result;
    }

    public async exit() : Promise<void> {
        (await this.proc()).stdin.write(JSON.stringify(new PacArguments("exit")));
    }
}

export class PacWrapper {
    public constructor(private readonly context: IPacWrapperContext, private readonly pacInterop: IPacInterop) {
    }

    private async executeCommandAndParseResults<T>(args: PacArguments): Promise<T> {
        const result = await this.pacInterop.executeCommand(args);
        const parsed : T = JSON.parse(result);
        return parsed;
    }

    public async authList(): Promise<PacAuthListOutput> {
        return this.executeCommandAndParseResults<PacAuthListOutput>(new PacArguments("auth", "list"));
    }

    public async authCreateNewDataverseProfile(): Promise<PacAuthListOutput> {
        // TODO: Update to Dataverse once those changes are in
        // TODO: Take URL argument
        return this.executeCommandAndParseResults<PacAuthListOutput>(new PacArguments("auth", "create", "--kind", "CDS", "--url", "https://ppdevtools.crm.dynamics.com"));
    }

    public async authCreateNewAdminProfile(): Promise<PacAuthListOutput> {
        return this.executeCommandAndParseResults<PacAuthListOutput>(new PacArguments("auth", "create", "--kind", "ADMIN"));
    }

    public async adminEnvironmentList(): Promise<PacAdminListOutput> {
        return this.executeCommandAndParseResults<PacAdminListOutput>(new PacArguments("admin", "list"));
    }

    public async solutionList(): Promise<PacSolutionListOutput> {
        return this.executeCommandAndParseResults<PacSolutionListOutput>(new PacArguments("solution", "list"));
    }

    public async enableTelemetry(): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("telemetry", "enable"));
    }

    public async disableTelemetry(): Promise<PacOutput> {
        return this.executeCommandAndParseResults<PacOutput>(new PacArguments("telemetry", "disable"));
    }

    public exit() : void {
        this.pacInterop.exit();
    }
}

export class PacArguments {
    public Arguments : string[];

    constructor(...args : string[]) {
        this.Arguments = args;
    }
}
