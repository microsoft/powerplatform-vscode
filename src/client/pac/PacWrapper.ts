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
    private proc : ChildProcessWithoutNullStreams;
    private outputQueue = new BlockingQueue<string>();
    private constructor(private readonly context: IPacWrapperContext) {
        // Set the Working Directory to a random temp folder, as we do not want
        // accidental writes by PAC being placed where they may interfere with things
        const pacWorkingDirectory = path.join(os.tmpdir(), v4());
        fs.ensureDirSync(pacWorkingDirectory);
        const pacExecutablePath = path.join(this.context.globalStorageLocalPath, 'pac', 'tools', PacInterop.getPacExecutableName());

        this.proc = spawn(pacExecutablePath, ["--non-interactive"], {
            cwd: pacWorkingDirectory,
            });

        const lineReader = readline.createInterface({ input: this.proc.stdout });
        lineReader.on('line', (line: string) => { this.outputQueue.enqueue(line); });
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

    public static async create(context: IPacWrapperContext): Promise<PacInterop> {
        const pac = new PacInterop(context);
        await pac.Init();
        return pac;
    }

    public async executeCommand(args: PacArguments): Promise<string> {
        const command = JSON.stringify(args) + "\n";
        this.proc.stdin.write(command);

        const result = await this.outputQueue.dequeue();
        return result;
    }

    public exit() : void {
        this.proc.stdin.write(JSON.stringify(new PacArguments("exit")));
    }

    private async Init() : Promise<boolean> {
        // Grab the first output, which should be a Success
        const output = await this.outputQueue.dequeue();
        const parsedOutput : PacOutput = JSON.parse(output);
        return parsedOutput.Status === "Success";
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
