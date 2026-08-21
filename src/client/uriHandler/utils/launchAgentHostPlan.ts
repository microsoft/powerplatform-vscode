/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import { PlannedCommand } from "./agentHostCommandPlan";

const SHELL_INTEGRATION_TIMEOUT_MS = 3000;

export type LaunchAgentHostPlanResult =
    | { status: "launched" }
    | {
        status: "recovery";
        reason: "shellIntegrationUnavailable" | "commandFailed";
        failedCommand?: PlannedCommand;
        exitCode?: number;
    };

/**
 * Side effects used by {@link launchAgentHostPlan}.
 */
export interface LaunchAgentHostPlanDependencies {
    createTerminal: (options: vscode.TerminalOptions) => vscode.Terminal;
    waitForShellIntegration: (
        terminal: vscode.Terminal
    ) => Promise<vscode.TerminalShellIntegration | undefined>;
    executeCommand: (
        shellIntegration: vscode.TerminalShellIntegration,
        commandLine: string
    ) => Promise<number | undefined>;
}

const waitForShellIntegration = async (
    terminal: vscode.Terminal
): Promise<vscode.TerminalShellIntegration | undefined> => {
    if (terminal.shellIntegration) {
        return terminal.shellIntegration;
    }

    return new Promise(resolve => {
        let settled = false;
        const settle = (
            shellIntegration: vscode.TerminalShellIntegration | undefined
        ): void => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            subscription.dispose();
            resolve(shellIntegration);
        };
        const subscription = vscode.window.onDidChangeTerminalShellIntegration(event => {
            if (event.terminal === terminal) {
                settle(event.shellIntegration);
            }
        });
        const timer = setTimeout(
            () => settle(undefined),
            SHELL_INTEGRATION_TIMEOUT_MS
        );
    });
};

const executeCommand = async (
    shellIntegration: vscode.TerminalShellIntegration,
    commandLine: string
): Promise<number | undefined> => {
    return new Promise((resolve, reject) => {
        let execution: vscode.TerminalShellExecution;
        const subscription = vscode.window.onDidEndTerminalShellExecution(event => {
            if (event.execution === execution) {
                subscription.dispose();
                resolve(event.exitCode);
            }
        });

        try {
            execution = shellIntegration.executeCommand(commandLine);
        } catch (error) {
            subscription.dispose();
            reject(error);
        }
    });
};

const DEFAULT_LAUNCH_DEPENDENCIES: LaunchAgentHostPlanDependencies = {
    createTerminal: (options) => vscode.window.createTerminal(options),
    waitForShellIntegration,
    executeCommand
};

/**
 * Executes the approved command plan sequentially through VS Code Shell Integration.
 *
 * Bootstrap and plugin commands must report exit code 0 before the next command starts. The final
 * interactive host command is started without awaiting its exit. When Shell Integration is
 * unavailable, no command is sent so the visible webview remains the manual recovery reference.
 *
 * @param folderUri Target folder the terminal is opened in.
 * @param plan Ordered command plan previewed and approved by the user.
 * @param hostDisplayName Agent host display name, used to name the terminal.
 * @param deps Optional injected side effects.
 * @param shellPath Optional deterministic shell used for missing-host bootstrap.
 */
export async function launchAgentHostPlan(
    folderUri: vscode.Uri,
    plan: PlannedCommand[],
    hostDisplayName: string,
    deps: LaunchAgentHostPlanDependencies = DEFAULT_LAUNCH_DEPENDENCIES,
    shellPath?: string
): Promise<LaunchAgentHostPlanResult> {
    const terminalName = URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.TERMINAL_NAME
        .split("{0}")
        .join(hostDisplayName);

    const terminal = deps.createTerminal({
        name: terminalName,
        cwd: folderUri.fsPath,
        isTransient: true,
        ...(shellPath ? { shellPath } : {})
    });
    terminal.show();

    const shellIntegration = await deps.waitForShellIntegration(terminal);
    if (!shellIntegration) {
        return {
            status: "recovery",
            reason: "shellIntegrationUnavailable"
        };
    }

    for (const command of plan) {
        if (command.kind === "launchHost") {
            try {
                shellIntegration.executeCommand(command.commandLine);
                return { status: "launched" };
            } catch {
                return {
                    status: "recovery",
                    reason: "commandFailed",
                    failedCommand: command
                };
            }
        }

        let exitCode: number | undefined;
        try {
            exitCode = await deps.executeCommand(
                shellIntegration,
                command.commandLine
            );
        } catch {
            return {
                status: "recovery",
                reason: "commandFailed",
                failedCommand: command
            };
        }
        if (exitCode !== 0) {
            return {
                status: "recovery",
                reason: "commandFailed",
                failedCommand: command,
                exitCode
            };
        }
    }

    return { status: "launched" };
}
