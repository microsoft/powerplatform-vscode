/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import {
    PlannedCommand,
    PlannedCommandKind
} from "./agentHostCommandPlan";

const SHELL_INTEGRATION_TIMEOUT_MS = 3000;

export type LaunchAgentHostPlanResult =
    | { status: "launched"; completedCommandKinds?: PlannedCommandKind[] }
    | {
        status: "recovery";
        reason: "shellIntegrationUnavailable" | "commandFailed";
        failedCommand?: PlannedCommand;
        exitCode?: number;
        completedCommandKinds?: PlannedCommandKind[];
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
        terminal: vscode.Terminal,
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
        const subscriptions: vscode.Disposable[] = [];
        const cleanup = (): void => {
            clearTimeout(timer);
            subscriptions.forEach(subscription => subscription.dispose());
        };
        const settle = (
            shellIntegration: vscode.TerminalShellIntegration | undefined
        ): void => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve(shellIntegration);
        };
        const timer = setTimeout(
            () => settle(undefined),
            SHELL_INTEGRATION_TIMEOUT_MS
        );
        const integrationSubscription = vscode.window.onDidChangeTerminalShellIntegration(event => {
            if (event.terminal === terminal) {
                settle(event.shellIntegration);
            }
        });
        const closeSubscription = vscode.window.onDidCloseTerminal(closedTerminal => {
            if (closedTerminal === terminal) {
                settle(undefined);
            }
        });
        subscriptions.push(integrationSubscription, closeSubscription);
    });
};

const executeCommand = async (
    terminal: vscode.Terminal,
    shellIntegration: vscode.TerminalShellIntegration,
    commandLine: string
): Promise<number | undefined> => {
    return new Promise((resolve, reject) => {
        let execution: vscode.TerminalShellExecution;
        let settled = false;
        const subscriptions: vscode.Disposable[] = [];
        const cleanup = (): void => {
            subscriptions.forEach(subscription => subscription.dispose());
        };
        const settle = (exitCode: number | undefined): void => {
            if (!settled) {
                settled = true;
                cleanup();
                resolve(exitCode);
            }
        };
        const executionSubscription = vscode.window.onDidEndTerminalShellExecution(event => {
            if (event.execution === execution) {
                settle(event.exitCode);
            }
        });
        const closeSubscription = vscode.window.onDidCloseTerminal(closedTerminal => {
            if (closedTerminal === terminal) {
                settle(undefined);
            }
        });
        subscriptions.push(executionSubscription, closeSubscription);

        try {
            execution = shellIntegration.executeCommand(commandLine);
        } catch (error) {
            settled = true;
            cleanup();
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
            reason: "shellIntegrationUnavailable",
            completedCommandKinds: []
        };
    }

    const completedCommandKinds: PlannedCommandKind[] = [];
    for (const command of plan) {
        if (command.kind === "launchHost") {
            try {
                shellIntegration.executeCommand(command.commandLine);
                completedCommandKinds.push(command.kind);
                return { status: "launched", completedCommandKinds };
            } catch {
                return {
                    status: "recovery",
                    reason: "commandFailed",
                    failedCommand: command,
                    completedCommandKinds
                };
            }
        }

        let exitCode: number | undefined;
        try {
            exitCode = await deps.executeCommand(
                terminal,
                shellIntegration,
                command.commandLine
            );
        } catch {
            return {
                status: "recovery",
                reason: "commandFailed",
                failedCommand: command,
                completedCommandKinds
            };
        }
        if (exitCode !== 0) {
            return {
                status: "recovery",
                reason: "commandFailed",
                failedCommand: command,
                exitCode,
                completedCommandKinds
            };
        }
        completedCommandKinds.push(command.kind);
    }

    return { status: "launched", completedCommandKinds };
}
