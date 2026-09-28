/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    execFile,
    ExecFileOptionsWithStringEncoding
} from "child_process";
import { existsSync } from "fs";
import * as path from "path";

export interface AgentHostCommandProbeResult {
    commandPath?: string;
    stdout: string;
}

export type AgentHostCommandProbe = (
    command: string,
    args: string[]
) => Promise<AgentHostCommandProbeResult>;

const TRUSTED_AGENT_HOST_COMMANDS = new Set(["copilot", "claude"]);
const TRUSTED_PROBE_ARGUMENT_PATTERN = /^[A-Za-z0-9@._/-]+$/u;
const TRUSTED_COMMAND_NAME_PATTERN = /^[A-Za-z0-9._-]+$/u;
const DEFAULT_WINDOWS_PATH_EXTENSIONS = ".COM;.EXE;.BAT;.CMD";

export type CommandPathResolver = (command: string) => string | undefined;

function hasUnsupportedControlCharacter(value: string): boolean {
    for (const character of value) {
        const characterCode = character.charCodeAt(0);
        if (
            characterCode <= 31
            || characterCode === 127
        ) {
            return true;
        }
    }
    return false;
}

/**
 * Resolves a command from absolute PATH entries without searching the current directory.
 */
export function resolveCommandFromPath(
    command: string,
    platform: NodeJS.Platform = process.platform,
    environmentPath: string = process.env.PATH ?? "",
    pathExtensions: string = process.env.PATHEXT ?? DEFAULT_WINDOWS_PATH_EXTENSIONS,
    fileExists: (filePath: string) => boolean = existsSync,
    currentDirectory: string = process.cwd()
): string | undefined {
    if (!TRUSTED_COMMAND_NAME_PATTERN.test(command)) {
        return undefined;
    }

    const pathApi = platform === "win32" ? path.win32 : path.posix;
    const delimiter = platform === "win32" ? ";" : ":";
    const normalizedCurrentDirectory = pathApi.normalize(currentDirectory);
    const extensions = platform === "win32" && !pathApi.extname(command)
        ? pathExtensions
            .split(";")
            .map(extension => extension.trim())
            .filter(Boolean)
        : [""];

    for (const rawDirectory of environmentPath.split(delimiter)) {
        const directory = rawDirectory.trim().replace(/^"(.*)"$/u, "$1");
        if (!directory || !pathApi.isAbsolute(directory)) {
            continue;
        }
        const normalizedDirectory = pathApi.normalize(directory);
        if (
            platform === "win32"
                ? normalizedDirectory.toLowerCase() === normalizedCurrentDirectory.toLowerCase()
                : normalizedDirectory === normalizedCurrentDirectory
        ) {
            continue;
        }

        for (const extension of extensions) {
            const candidate = pathApi.join(normalizedDirectory, `${command}${extension}`);
            if (fileExists(candidate)) {
                return candidate;
            }
        }
    }

    return undefined;
}

/**
 * Builds process options for trusted, fixed agent-host probe commands.
 * Windows uses the command processor only for an already-resolved `.cmd` or `.bat` shim.
 */
export function getAgentHostCommandProbeOptions(
    timeout: number,
    resolvedCommand: string,
    platform: NodeJS.Platform = process.platform
): ExecFileOptionsWithStringEncoding {
    const pathApi = platform === "win32" ? path.win32 : path.posix;
    return {
        cwd: pathApi.dirname(resolvedCommand),
        encoding: "utf8",
        timeout,
        windowsHide: true,
        shell: platform === "win32" && /\.(?:cmd|bat)$/iu.test(resolvedCommand)
    };
}

/**
 * Selects an executable that PowerShell can invoke without batch-file argument reparsing.
 */
export function resolveAgentHostTerminalExecutable(
    detectedCommandPath: string | undefined,
    shellPath: string,
    platform: NodeJS.Platform = process.platform,
    fileExists: (filePath: string) => boolean = existsSync
): string | undefined {
    if (!detectedCommandPath || platform !== "win32") {
        return detectedCommandPath;
    }
    const parsedPath = path.win32.parse(detectedCommandPath);
    if (!/^\.(?:cmd|bat)$/iu.test(parsedPath.ext)) {
        return detectedCommandPath;
    }

    const shellName = path.win32.basename(shellPath).toLowerCase();
    const isPowerShell = shellName === "pwsh"
        || shellName === "pwsh.exe"
        || shellName === "powershell"
        || shellName === "powershell.exe";
    const candidateExtensions = isPowerShell
        ? [".exe", ".ps1"]
        : [".exe", ""];
    for (const extension of candidateExtensions) {
        const candidate = path.win32.join(
            parsedPath.dir,
            `${parsedPath.name}${extension}`
        );
        if (fileExists(candidate)) {
            return candidate;
        }
    }
    return undefined;
}

/**
 * Executes a trusted agent-host probe command and captures its standard output.
 */
export function runAgentHostCommandProbe(
    command: string,
    args: string[],
    timeout: number,
    resolveCommand: CommandPathResolver = resolveCommandFromPath
): Promise<AgentHostCommandProbeResult> {
    if (
        !TRUSTED_AGENT_HOST_COMMANDS.has(command)
        || hasUnsupportedControlCharacter(command)
        || args.some(argument => !TRUSTED_PROBE_ARGUMENT_PATTERN.test(argument))
    ) {
        return Promise.reject(new Error("Unsupported agent host probe command"));
    }
    const resolvedCommand = resolveCommand(command);
    if (!resolvedCommand) {
        return Promise.reject(
            Object.assign(new Error(`Agent host command not found: ${command}`), {
                code: "ENOENT"
            })
        );
    }

    return new Promise((resolve, reject) => {
        const options = getAgentHostCommandProbeOptions(timeout, resolvedCommand);
        const executable = options.shell
            ? path.win32.basename(resolvedCommand)
            : resolvedCommand;
        execFile(
            executable,
            args,
            options,
            (error, stdout) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve({
                    commandPath: resolvedCommand,
                    stdout
                });
            }
        );
    });
}
