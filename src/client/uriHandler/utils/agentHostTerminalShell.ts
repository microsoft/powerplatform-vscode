/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

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

/**
 * Selects a deterministic Shell Integration-compatible terminal on Windows.
 *
 * VS Code's terminal API does not accept a configured profile name. Passing `pwsh` as `shellPath`
 * selects PowerShell 7 even when the user's default profile is cmd.exe. Other platforms retain the
 * complete configured terminal profile.
 */
export function resolveAgentHostTerminalShell(
    defaultShellPath: string,
    platform: NodeJS.Platform = process.platform,
    resolveCommand: CommandPathResolver = resolveCommandFromPath
): AgentHostTerminalShell {
    const powerShellPath = platform === "win32"
        ? resolveCommand("pwsh")
        : undefined;
    if (powerShellPath) {
        return {
            commandShellPath: powerShellPath,
            terminalShellPath: powerShellPath
        };
    }

    return {
        commandShellPath: defaultShellPath
    };
}
