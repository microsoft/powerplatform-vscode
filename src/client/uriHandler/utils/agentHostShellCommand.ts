/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";

function quotePowerShellArgument(argument: string): string {
    return `'${argument.replace(/'/g, "''")}'`;
}

function quotePosixArgument(argument: string): string {
    return `'${argument.replace(/'/g, `'"'"'`)}'`;
}

function quoteFishArgument(argument: string): string {
    return `'${argument.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function getShellName(
    shellPath: string,
    platform: NodeJS.Platform = process.platform
): string {
    return (platform === "win32" ? path.win32 : path.posix)
        .basename(shellPath)
        .toLowerCase();
}

function getShellArgumentQuoter(
    shellPath: string,
    platform: NodeJS.Platform = process.platform
): ((argument: string) => string) | undefined {
    const shellName = getShellName(shellPath, platform);
    if (shellName === "pwsh" || shellName === "pwsh.exe"
        || shellName === "powershell" || shellName === "powershell.exe") {
        return quotePowerShellArgument;
    }
    if (
        shellName === "bash" || shellName === "bash.exe"
        || shellName === "zsh" || shellName === "sh"
    ) {
        return quotePosixArgument;
    }
    if (shellName === "fish") {
        return quoteFishArgument;
    }
    return undefined;
}

/**
 * Returns whether the terminal shell has a supported argument-escaping strategy.
 */
export function isAgentHostShellSupported(
    shellPath: string,
    platform: NodeJS.Platform = process.platform
): boolean {
    return getShellArgumentQuoter(shellPath, platform) !== undefined;
}

/**
 * Returns whether VS Code can provide Shell Integration for the selected shell.
 */
export function isAgentHostShellIntegrationSupported(
    shellPath: string,
    platform: NodeJS.Platform = process.platform
): boolean {
    const shellName = getShellName(shellPath, platform);
    if (platform === "win32") {
        return shellName === "pwsh"
            || shellName === "pwsh.exe"
            || shellName === "bash"
            || shellName === "bash.exe";
    }

    return shellName === "pwsh"
        || shellName === "bash"
        || shellName === "zsh"
        || shellName === "fish";
}

/**
 * Returns whether the host executable can receive untrusted arguments without batch reparsing.
 */
export function isAgentHostExecutableSupported(
    executable: string,
    platform: NodeJS.Platform = process.platform
): boolean {
    return platform !== "win32"
        || !/\.(?:cmd|bat)$/iu.test(path.win32.extname(executable));
}

/**
 * Builds a shell-safe command from a fixed executable and untrusted arguments.
 */
export function buildAgentHostShellCommand(
    executable: string,
    args: string[],
    shellPath: string,
    platform: NodeJS.Platform = process.platform
): string {
    for (const character of executable) {
        const characterCode = character.charCodeAt(0);
        if (
            characterCode <= 31
            || characterCode === 127
        ) {
            throw new Error("Unsupported agent host executable");
        }
    }

    const quoteArgument = getShellArgumentQuoter(shellPath, platform);
    if (!quoteArgument) {
        throw new Error(`Unsupported terminal shell: ${getShellName(shellPath, platform)}`);
    }

    const shellName = getShellName(shellPath, platform);
    const isPowerShell = shellName === "pwsh"
        || shellName === "pwsh.exe"
        || shellName === "powershell"
        || shellName === "powershell.exe";
    const executableForShell = platform === "win32"
        && (shellName === "bash" || shellName === "bash.exe")
        ? executable.replace(/\\/gu, "/")
        : executable;
    const simpleExecutable = /^[A-Za-z0-9._/-]+$/u.test(executableForShell);
    const executableToken = simpleExecutable
        ? executableForShell
        : isPowerShell
            ? `& ${quoteArgument(executableForShell)}`
            : quoteArgument(executableForShell);

    return [executableToken, ...args.map(quoteArgument)].join(" ");
}
