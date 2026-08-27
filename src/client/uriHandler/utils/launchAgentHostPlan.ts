/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as path from "path";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import {
    PlannedCommand,
    PlannedCommandKind
} from "./agentHostCommandPlan";
import {
    AgentHostSetupState,
    classifyAgentHostSetupOutput
} from "./agentHostSetupPrecheck";

const SHELL_INTEGRATION_TIMEOUT_MS = 3000;

function quotePowerShellArgument(argument: string): string {
    return `'${argument.replace(/'/g, "''")}'`;
}

function quotePosixArgument(argument: string): string {
    return `'${argument.replace(/'/g, `'"'"'`)}'`;
}

function quoteFishArgument(argument: string): string {
    return `'${argument.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

/**
 * Builds a shell-safe command from a fixed executable and untrusted arguments.
 */
export function buildAgentHostShellCommand(
    executable: string,
    args: string[],
    shellPath: string
): string {
    if (!/^[A-Za-z0-9._/-]+$/u.test(executable)) {
        throw new Error("Unsupported agent host executable");
    }

    const shellName = path.basename(shellPath).toLowerCase();
    let quoteArgument: (argument: string) => string;
    if (shellName === "pwsh" || shellName === "pwsh.exe"
        || shellName === "powershell" || shellName === "powershell.exe") {
        quoteArgument = quotePowerShellArgument;
    } else if (
        shellName === "bash" || shellName === "bash.exe"
        || shellName === "zsh" || shellName === "sh"
    ) {
        quoteArgument = quotePosixArgument;
    } else if (shellName === "fish") {
        quoteArgument = quoteFishArgument;
    } else {
        throw new Error(`Unsupported terminal shell: ${shellName}`);
    }

    return [executable, ...args.map(quoteArgument)].join(" ");
}

export type LaunchAgentHostPlanResult =
    | {
        status: "launched";
        completedCommandKinds?: PlannedCommandKind[];
        skippedCommandKinds?: PlannedCommandKind[];
        setupState?: AgentHostSetupState;
        terminal?: vscode.Terminal;
    }
    | {
        status: "recovery";
        reason: "shellIntegrationUnavailable" | "commandFailed";
        failedCommand?: PlannedCommand;
        exitCode?: number;
        completedCommandKinds?: PlannedCommandKind[];
        skippedCommandKinds?: PlannedCommandKind[];
        setupState?: AgentHostSetupState;
    };

export interface AgentHostCommandExecutionResult {
    exitCode: number | undefined;
    output: string;
}

export interface LaunchAgentHostProgress {
    command: PlannedCommand;
    step: number;
    totalSteps: number;
    status: "running" | "skipped";
}

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
    ) => Promise<AgentHostCommandExecutionResult>;
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
): Promise<AgentHostCommandExecutionResult> => {
    return new Promise((resolve, reject) => {
        let execution: vscode.TerminalShellExecution;
        let output = "";
        let settled = false;
        let outputComplete: Promise<void> = Promise.resolve();
        const subscriptions: vscode.Disposable[] = [];
        const cleanup = (): void => {
            subscriptions.forEach(subscription => subscription.dispose());
        };
        const settle = (exitCode: number | undefined): void => {
            if (!settled) {
                settled = true;
                void (async () => {
                    if (exitCode !== undefined) {
                        await outputComplete;
                    }
                    cleanup();
                    resolve({ exitCode, output });
                })();
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
            outputComplete = (async () => {
                try {
                    for await (const chunk of execution.read()) {
                        output += chunk;
                    }
                } catch {
                    // The exit code remains the authoritative execution outcome.
                }
            })();
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
    shellPath?: string,
    initialSetupState: AgentHostSetupState = {
        marketplace: "unknown",
        plugin: "unknown"
    },
    onProgress?: (progress: LaunchAgentHostProgress) => void
): Promise<LaunchAgentHostPlanResult> {
    const terminalName = URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.TERMINAL_NAME
        .split("{0}")
        .join(hostDisplayName);
    const executionShellPath = shellPath ?? vscode.env.shell;

    const terminal = deps.createTerminal({
        name: terminalName,
        cwd: folderUri.fsPath,
        isTransient: true,
        ...(executionShellPath ? { shellPath: executionShellPath } : {})
    });
    terminal.show();

    const shellIntegration = await deps.waitForShellIntegration(terminal);
    if (!shellIntegration) {
        return {
            status: "recovery",
            reason: "shellIntegrationUnavailable",
            completedCommandKinds: [],
            skippedCommandKinds: [],
            setupState: initialSetupState
        };
    }

    const completedCommandKinds: PlannedCommandKind[] = [];
    const skippedCommandKinds: PlannedCommandKind[] = [];
    const setupState = { ...initialSetupState };
    for (const [index, command] of plan.entries()) {
        if (
            command.runWhenSetupState
            && !command.runWhenSetupState.states.includes(
                setupState[command.runWhenSetupState.component]
            )
        ) {
            skippedCommandKinds.push(command.kind);
            onProgress?.({
                command,
                step: index + 1,
                totalSteps: plan.length,
                status: "skipped"
            });
            continue;
        }

        onProgress?.({
            command,
            step: index + 1,
            totalSteps: plan.length,
            status: "running"
        });
        if (command.kind === "launchHost") {
            try {
                if (command.executable && command.args) {
                    shellIntegration.executeCommand(buildAgentHostShellCommand(
                        command.executable,
                        command.args,
                        executionShellPath
                    ));
                } else {
                    shellIntegration.executeCommand(command.commandLine);
                }
                completedCommandKinds.push(command.kind);
                return {
                    status: "launched",
                    completedCommandKinds,
                    skippedCommandKinds,
                    setupState,
                    terminal
                };
            } catch {
                return {
                    status: "recovery",
                    reason: "commandFailed",
                    failedCommand: command,
                    completedCommandKinds,
                    skippedCommandKinds,
                    setupState
                };
            }
        }

        let executionResult: AgentHostCommandExecutionResult;
        try {
            executionResult = await deps.executeCommand(
                terminal,
                shellIntegration,
                command.commandLine
            );
        } catch {
            return {
                status: "recovery",
                reason: "commandFailed",
                failedCommand: command,
                completedCommandKinds,
                skippedCommandKinds,
                setupState
            };
        }

        if (command.setupCheck) {
            setupState[command.setupCheck] = executionResult.exitCode === 0
                ? classifyAgentHostSetupOutput(
                    executionResult.output,
                    command.setupCheck
                )
                : "unknown";
            completedCommandKinds.push(command.kind);
            continue;
        }

        if (executionResult.exitCode !== 0) {
            return {
                status: "recovery",
                reason: "commandFailed",
                failedCommand: command,
                exitCode: executionResult.exitCode,
                completedCommandKinds,
                skippedCommandKinds,
                setupState
            };
        }
        if (command.kind === "registerMarketplace") {
            setupState.marketplace = "present";
        } else if (
            command.kind === "installPlugin"
            || command.kind === "enablePlugin"
        ) {
            setupState.plugin = "present";
        }
        completedCommandKinds.push(command.kind);
    }

    return {
        status: "launched",
        completedCommandKinds,
        skippedCommandKinds,
        setupState,
        terminal
    };
}
