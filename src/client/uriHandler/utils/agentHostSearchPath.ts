/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { execFile } from "child_process";
import { lstatSync, statSync } from "fs";
import * as path from "path";

const WINDOWS_MACHINE_ENVIRONMENT_KEY = "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment";
const WINDOWS_USER_ENVIRONMENT_KEY = "HKCU\\Environment";
const REGISTRY_QUERY_TIMEOUT_MS = 5000;

/** Reads the persisted `Path` value for a Windows registry environment key. */
export type RegistryPathReader = (key: string) => Promise<string | undefined>;

/**
 * Returns an environment value using Windows case-insensitive lookup where required.
 * @param environment Environment to read.
 * @param name Variable name.
 * @param platform Runtime platform.
 * @returns The variable value, or undefined.
 */
export function getEnvironmentValue(
    environment: NodeJS.ProcessEnv,
    name: string,
    platform: NodeJS.Platform = process.platform
): string | undefined {
    if (platform !== "win32") {
        return environment[name];
    }
    const key = Object.keys(environment).find(candidate => candidate.toLowerCase() === name.toLowerCase());
    return key ? environment[key] : undefined;
}

/**
 * Extracts the `Path` value from `reg.exe query` output.
 * @param output Standard output of `reg query <key> /v Path`.
 * @returns The raw registry value, or undefined when absent.
 */
export function parseRegistryPathValue(output: string): string | undefined {
    for (const line of output.split(/\r?\n/u)) {
        const match = /^\s+Path\s+REG_(?:EXPAND_)?SZ\s+(.*)$/iu.exec(line);
        if (match) {
            return match[1].trim();
        }
    }
    return undefined;
}

/**
 * Expands `%NAME%` references the same way Windows expands `REG_EXPAND_SZ` values.
 * @param value Raw value that may contain variable references.
 * @param environment Environment used for expansion.
 * @returns The expanded value. Unknown variables are preserved.
 */
export function expandWindowsEnvironmentVariables(
    value: string,
    environment: NodeJS.ProcessEnv
): string {
    return value.replace(/%([^%;]+)%/gu, (match, name: string) =>
        getEnvironmentValue(environment, name, "win32") ?? match);
}

const readWindowsRegistryPath: RegistryPathReader = key => new Promise(resolve => {
    const systemRoot = getEnvironmentValue(process.env, "SystemRoot", "win32") ?? "C:\\Windows";
    execFile(
        path.win32.join(systemRoot, "System32", "reg.exe"),
        ["query", key, "/v", "Path"],
        { encoding: "utf8", timeout: REGISTRY_QUERY_TIMEOUT_MS, windowsHide: true },
        (error, stdout) => resolve(error ? undefined : parseRegistryPathValue(stdout))
    );
});

function normalizeDirectory(directory: string, platform: NodeJS.Platform): string {
    const pathApi = platform === "win32" ? path.win32 : path.posix;
    const normalized = pathApi.normalize(directory).replace(/[\\/]+$/u, "");
    return platform === "win32" ? normalized.toLowerCase() : normalized;
}

/**
 * Appends absolute directories to a search path without reordering or duplicating existing entries.
 * Existing entries win so an already-installed host resolves exactly as it does in a new terminal.
 * @param currentPath Search path inherited by VS Code.
 * @param additions Candidate directories to append in order.
 * @param platform Runtime platform.
 * @returns The current path when nothing was added, otherwise the extended path.
 */
export function appendSearchPathEntries(
    currentPath: string,
    additions: readonly string[],
    platform: NodeJS.Platform = process.platform
): string {
    const pathApi = platform === "win32" ? path.win32 : path.posix;
    const delimiter = platform === "win32" ? ";" : ":";
    const known = new Set(currentPath
        .split(delimiter)
        .map(entry => entry.trim().replace(/^"(.*)"$/u, "$1"))
        .filter(Boolean)
        .map(entry => normalizeDirectory(entry, platform)));
    const appended: string[] = [];
    for (const rawEntry of additions) {
        const entry = rawEntry.trim().replace(/^"(.*)"$/u, "$1");
        if (!entry || !pathApi.isAbsolute(entry) || /%[^%;]+%/u.test(entry)) {
            continue;
        }
        const key = normalizeDirectory(entry, platform);
        if (!known.has(key)) {
            known.add(key);
            appended.push(entry);
        }
    }
    if (appended.length === 0) {
        return currentPath;
    }
    return [currentPath, ...appended]
        .filter(Boolean)
        .join(delimiter);
}

/**
 * Builds the executable search path that a freshly opened shell would see after an installer ran.
 *
 * Windows appends the persisted machine and user `Path` registry values plus the winget portable
 * link directories. Other platforms append `$HOME/.local/bin`, used by the official install scripts.
 * @param platform Runtime platform.
 * @param environment Current extension-host environment.
 * @param readRegistryPath Injectable Windows registry reader.
 * @returns The current search path extended with installer locations.
 */
export async function resolveAgentHostSearchPath(
    platform: NodeJS.Platform = process.platform,
    environment: NodeJS.ProcessEnv = process.env,
    readRegistryPath: RegistryPathReader = readWindowsRegistryPath
): Promise<string> {
    const currentPath = getEnvironmentValue(environment, "PATH", platform) ?? "";
    if (platform !== "win32") {
        const home = environment.HOME;
        return appendSearchPathEntries(
            currentPath,
            home ? [path.posix.join(home, ".local", "bin")] : [],
            platform
        );
    }

    const [machinePath, userPath] = await Promise.all([
        readRegistryPath(WINDOWS_MACHINE_ENVIRONMENT_KEY).catch(() => undefined),
        readRegistryPath(WINDOWS_USER_ENVIRONMENT_KEY).catch(() => undefined)
    ]);
    const localAppData = getEnvironmentValue(environment, "LOCALAPPDATA", platform);
    const programFiles = getEnvironmentValue(environment, "ProgramFiles", platform);
    const registryEntries = [machinePath, userPath]
        .filter((value): value is string => Boolean(value))
        .flatMap(value => expandWindowsEnvironmentVariables(value, environment).split(";"));
    return appendSearchPathEntries(currentPath, [
        ...registryEntries,
        ...(localAppData ? [path.win32.join(localAppData, "Microsoft", "WinGet", "Links")] : []),
        ...(programFiles ? [path.win32.join(programFiles, "WinGet", "Links")] : [])
    ], platform);
}

/**
 * Returns whether a path is a launchable file, following symbolic links.
 * @param filePath Candidate path.
 * @returns True for an existing regular file.
 */
export function isLaunchableFile(filePath: string): boolean {
    try {
        return statSync(filePath).isFile();
    } catch {
        return false;
    }
}

/**
 * Returns whether a path is a file or a Windows App Execution Alias such as `winget.exe`.
 * App Execution Aliases are reparse points that `stat` cannot follow but `CreateProcess` can run.
 * @param filePath Candidate path.
 * @returns True when the entry exists and is not a directory.
 */
export function isSpawnableFile(filePath: string): boolean {
    if (isLaunchableFile(filePath)) {
        return true;
    }
    try {
        return !lstatSync(filePath).isDirectory();
    } catch {
        return false;
    }
}
