// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as os from "os";
import * as path from "path";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { BlockingQueue } from "../../common/utilities/BlockingQueue";
import { ITelemetry } from "../telemetry/ITelemetry";
import { PacOutput, PacAdminListOutput, PacAuthListOutput, PacSolutionListOutput } from "./pacTypes";

export interface IPacWrapperContext {
    readonly globalStorageLocalPath: string;
    readonly telemetry: ITelemetry;
}

export interface IPacInterop {
    executeCommand(args: PacArguments): Promise<string>;
    exit(): void;
}

export class PacInterop implements IPacInterop {
    private proc : ChildProcessWithoutNullStreams;
    private outputQueue = new BlockingQueue<string>();
    private partialOutput = "";
    private constructor(private readonly context: IPacWrapperContext) {
        const pacWorkingDirectory = path.join(this.context.globalStorageLocalPath, 'pac', 'tools');
        const pacExecutablePath = path.join(pacWorkingDirectory, PacInterop.getPacExecutableName());

        this.proc = spawn(pacExecutablePath, ["--non-interactive"], {
            cwd: pacWorkingDirectory,
            });

        this.proc.stdout.on("data", (data : Buffer) => {
            // Output may contain multiple lines and/or partial lines.
            // If we have a partial line from the last event, prepend it.
            const str = this.partialOutput ? this.partialOutput + data.toString() : data.toString();
            const split = str.split(os.EOL).filter(i => i);

            // If the last item doesn't end in a closing brace, it's a partial line.
            // Remove it from the current processing, and prepend on the next run.
            if (!split[split.length - 1].endsWith('}')) {
                this.partialOutput = split.pop() || "";
            } else {
                this.partialOutput = "";
            }

            split.forEach((value) => this.outputQueue.enqueue(value));
        });
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

    public async adminEnvironmentList(): Promise<PacAdminListOutput> {
        return this.executeCommandAndParseResults<PacAdminListOutput>(new PacArguments("admin", "list"));
    }

    public async solutionList(): Promise<PacSolutionListOutput> {
        return this.executeCommandAndParseResults<PacSolutionListOutput>(new PacArguments("solution", "list"));
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
