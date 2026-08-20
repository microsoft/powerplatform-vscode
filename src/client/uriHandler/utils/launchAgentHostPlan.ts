/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import { PlannedCommand } from "./agentHostCommandPlan";

/**
 * Side effects used by {@link launchAgentHostPlan}. Injected so terminal creation can be faked.
 */
export interface LaunchAgentHostPlanDependencies {
    createTerminal: (options: vscode.TerminalOptions) => vscode.Terminal;
}

const DEFAULT_LAUNCH_DEPENDENCIES: LaunchAgentHostPlanDependencies = {
    createTerminal: (options) => vscode.window.createTerminal(options)
};

/**
 * Opens a dedicated integrated terminal in the target folder and sends each planned command line
 * in order. Commands are sent as separate lines (no `&&` chaining) so the flow works on Windows
 * PowerShell 5.1; this is the accepted POC launch model. Nothing is success-gated between lines.
 *
 * @param folderUri Target folder the terminal is opened in.
 * @param plan Ordered command plan previewed and approved by the user.
 * @param hostDisplayName Agent host display name, used to name the terminal.
 * @param deps Optional injected side effects.
 */
export function launchAgentHostPlan(
    folderUri: vscode.Uri,
    plan: PlannedCommand[],
    hostDisplayName: string,
    deps: LaunchAgentHostPlanDependencies = DEFAULT_LAUNCH_DEPENDENCIES
): void {
    const terminalName = URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.TERMINAL_NAME
        .split("{0}")
        .join(hostDisplayName);

    const terminal = deps.createTerminal({
        name: terminalName,
        cwd: folderUri.fsPath,
        isTransient: true
    });
    terminal.show();

    for (const command of plan) {
        terminal.sendText(command.commandLine);
    }
}
