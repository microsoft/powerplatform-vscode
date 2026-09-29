/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { statSync } from "fs";
import * as path from "path";
import {
    CommandPathResolver,
    resolveCommandFromPath
} from "./agentHostCommandProbe";

export interface AgentHostTerminalShell {
    /** Shell used to quote commands shown in the confirmation and sent for execution. */
    commandShellPath: string;
    /** Explicit shell override for terminal creation. Undefined preserves the configured profile. */
    terminalShellPath?: string;
}

/** Injectable Windows shell discovery inputs, shared by launch and bootstrap. */
export interface AgentHostTerminalShellOptions {
    /** Paths explicitly configured in user-global VS Code Windows profiles, in preference order. */
    profilePaths?: readonly string[];
    environment?: NodeJS.ProcessEnv;
    isFile?: (filePath: string) => boolean;
}

function isFile(filePath: string): boolean {
    try {
        return statSync(filePath).isFile();
    } catch {
        return false;
    }
}

function getEnvironmentValue(environment: NodeJS.ProcessEnv, name: string): string | undefined {
    const key = Object.keys(environment).find(key => key.toLowerCase() === name.toLowerCase());
    return key ? environment[key] : undefined;
}

function expandPath(candidate: string, environment: NodeJS.ProcessEnv): string {
    return candidate
        .replace(/\$\{env:([^}]+)\}|%([^%]+)%/giu, (match, variable, percentVariable) =>
            getEnvironmentValue(environment, variable ?? percentVariable) ?? match)
        .replace(/\$\{userHome\}/gu, getEnvironmentValue(environment, "USERPROFILE") ?? "${userHome}");
}

function findShell(
    candidates: Array<string | undefined>,
    shellName: string,
    options: AgentHostTerminalShellOptions,
    accept: (candidate: string, fileExists: (filePath: string) => boolean) => boolean = () => true
): string | undefined {
    const environment = options.environment ?? process.env;
    const fileExists = options.isFile ?? isFile;
    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }
        const expanded = expandPath(candidate, environment);
        // Drive-relative paths and unresolved VS Code variables must never select an executor.
        if (!/^(?:[a-z]:[\\/]|\\\\[^\\]+\\[^\\]+\\)/iu.test(expanded)
            || [...expanded].some(character => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127)
            || /\$\{|%[^%]+%/u.test(expanded)) {
            continue;
        }
        const normalized = path.win32.normalize(expanded);
        const explicitlyConfigured = options.profilePaths?.some(profilePath =>
            path.win32.normalize(expandPath(profilePath, environment)).toLowerCase() === normalized.toLowerCase());
        if (path.win32.dirname(normalized) === path.win32.parse(normalized).root
            && !explicitlyConfigured) {
            continue;
        }
        if (path.win32.basename(normalized).toLowerCase() === shellName
            && fileExists(normalized)
            && accept(normalized, fileExists)) {
            return normalized;
        }
    }
    return undefined;
}

function installRoots(options: AgentHostTerminalShellOptions): string[] {
    const environment = options.environment ?? process.env;
    return ["ProgramW6432", "ProgramFiles", "ProgramFiles(x86)"]
        .map(name => getEnvironmentValue(environment, name))
        .filter((value): value is string => Boolean(value));
}

function pathCandidates(executable: string, options: AgentHostTerminalShellOptions): string[] {
    const currentDirectory = path.win32.normalize(process.cwd()).toLowerCase();
    return (getEnvironmentValue(options.environment ?? process.env, "PATH") ?? "")
        .split(";")
        .map(directory => directory.trim().replace(/^"(.*)"$/u, "$1"))
        .filter(directory => path.win32.isAbsolute(directory)
            && path.win32.normalize(directory).toLowerCase() !== currentDirectory)
        .map(directory => path.win32.join(directory, executable));
}

/**
 * Finds an installed PowerShell 7 executable without relying on a refreshed extension-host PATH.
 * @param resolveCommand Injectable PATH lookup.
 * @param options Configured profile paths and injectable file-system/environment inputs.
 * @returns A validated absolute PowerShell executable path, or undefined.
 */
export function resolveAgentHostPowerShell(
    resolveCommand: CommandPathResolver = resolveCommandFromPath,
    options: AgentHostTerminalShellOptions = {}
): string | undefined {
    const localAppData = getEnvironmentValue(options.environment ?? process.env, "LOCALAPPDATA");
    return findShell([
        resolveCommand("pwsh"),
        resolveCommand("pwsh.exe"),
        ...pathCandidates("pwsh.exe", options),
        ...(options.profilePaths ?? []),
        ...installRoots(options).map(root => path.win32.join(root, "PowerShell", "7", "pwsh.exe")),
        localAppData && path.win32.join(localAppData, "Microsoft", "PowerShell", "7", "pwsh.exe")
    ], "pwsh.exe", options);
}

function isGitBash(candidate: string, fileExists: (filePath: string) => boolean): boolean {
    const directory = path.win32.dirname(candidate);
    if (path.win32.basename(directory).toLowerCase() !== "bin") {
        return false;
    }
    const parent = path.win32.dirname(directory);
    const root = path.win32.basename(parent).toLowerCase() === "usr"
        ? path.win32.dirname(parent)
        : parent;
    return ["cmd", "bin", "mingw64\\bin", "mingw32\\bin"]
        .some(relative => fileExists(path.win32.join(root, relative, "git.exe")));
}

/**
 * Selects a deterministic Shell Integration-compatible terminal on Windows.
 *
 * Only installed PowerShell 7 or Git for Windows Bash can execute automatically. Installed Windows
 * PowerShell is a manual-only quoting fallback; the launcher's Shell Integration guard rejects it.
 * An empty path means no usable shell was found and both execution and manual copying are blocked.
 * Other platforms retain the complete configured terminal profile.
 * @param defaultShellPath Current configured shell.
 * @param platform Runtime platform.
 * @param resolveCommand Injectable executable lookup.
 * @param options Configured profile paths and file-system/environment inputs.
 * @returns Matching preview and terminal shell paths, or the unchanged non-Windows profile.
 */
export function resolveAgentHostTerminalShell(
    defaultShellPath: string,
    platform: NodeJS.Platform = process.platform,
    resolveCommand: CommandPathResolver = resolveCommandFromPath,
    options: AgentHostTerminalShellOptions = {}
): AgentHostTerminalShell {
    if (platform !== "win32") {
        return { commandShellPath: defaultShellPath };
    }
    const powerShellPath = resolveAgentHostPowerShell(resolveCommand, options);
    const environment = options.environment ?? process.env;
    const localAppData = getEnvironmentValue(environment, "LOCALAPPDATA");
    const gitPath = powerShellPath ? undefined : resolveCommand("git.exe");
    const gitDirectory = gitPath ? path.win32.dirname(gitPath) : undefined;
    const gitRoot = gitDirectory && ["cmd", "bin"].includes(path.win32.basename(gitDirectory).toLowerCase())
        ? path.win32.dirname(gitDirectory)
        : undefined;
    const gitRoots = [
        ...(gitRoot ? [gitRoot] : []),
        ...installRoots(options).map(root => path.win32.join(root, "Git")),
        ...(localAppData ? [path.win32.join(localAppData, "Programs", "Git")] : [])
    ];
    const gitBashPath = powerShellPath ? undefined : findShell([
        resolveCommand("bash"),
        resolveCommand("bash.exe"),
        ...pathCandidates("bash.exe", options),
        ...(options.profilePaths ?? []),
        ...gitRoots.flatMap(root => [
            path.win32.join(root, "bin", "bash.exe"),
            path.win32.join(root, "usr", "bin", "bash.exe")
        ])
    ], "bash.exe", options, isGitBash);
    const systemRoot = getEnvironmentValue(environment, "SystemRoot");
    const manualPowerShellPath = powerShellPath || gitBashPath ? undefined : findShell([
        resolveCommand("powershell"),
        resolveCommand("powershell.exe"),
        ...pathCandidates("powershell.exe", options),
        ...(options.profilePaths ?? []),
        systemRoot && path.win32.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
    ], "powershell.exe", options);
    const shellPath = powerShellPath ?? gitBashPath ?? manualPowerShellPath ?? "";
    return {
        commandShellPath: shellPath,
        terminalShellPath: shellPath
    };
}
