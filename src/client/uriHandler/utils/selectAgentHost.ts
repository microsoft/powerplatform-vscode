/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import { AgentHost, AgentHostDetectionResult } from "./detectAgentHost";

/**
 * Selected agent host and its installation state.
 */
export interface AgentHostSelection {
    host: AgentHost;
    installed: boolean;
    executablePath?: string;
}

export interface AgentHostQuickPickItem extends vscode.QuickPickItem {
    host: AgentHost;
    installed: boolean;
    executablePath?: string;
}

const AGENT_HOST_DISPLAY_NAMES: Record<AgentHost, string> = {
    [AgentHost.Copilot]: URI_HANDLER_STRINGS.AGENT_HOSTS.COPILOT,
    [AgentHost.Claude]: URI_HANDLER_STRINGS.AGENT_HOSTS.CLAUDE
};
const AGENT_HOST_DETAILS: Record<AgentHost, string> = {
    [AgentHost.Copilot]: URI_HANDLER_STRINGS.AGENT_HOSTS.COPILOT_DETAIL,
    [AgentHost.Claude]: URI_HANDLER_STRINGS.AGENT_HOSTS.CLAUDE_DETAIL
};

const getAgentHostDescription = (result: AgentHostDetectionResult): string => {
    if (!result.installed) {
        return URI_HANDLER_STRINGS.DESCRIPTIONS.AGENT_HOST_NOT_INSTALLED;
    }

    return URI_HANDLER_STRINGS.AGENT_HOSTS.INSTALLED;
};

/**
 * Builds agent-host items shared by the standalone picker and Agentic Create wizard.
 * @param detection Agent-host detection results in display order.
 * @returns Quick Pick items carrying the host selection data.
 */
export const getAgentHostQuickPickItems = (
    detection: AgentHostDetectionResult[]
): AgentHostQuickPickItem[] => detection.map(result => {
    const detail = result.installed
        ? AGENT_HOST_DETAILS[result.host]
        : `${AGENT_HOST_DETAILS[result.host]} ${
            URI_HANDLER_STRINGS.DESCRIPTIONS.AGENT_HOST_NOT_INSTALLED_DETAIL
        }`;
    return {
        label: AGENT_HOST_DISPLAY_NAMES[result.host],
        description: getAgentHostDescription(result),
        detail,
        host: result.host,
        installed: result.installed,
        ...(result.executablePath ? { executablePath: result.executablePath } : {})
    };
});

/**
 * Removes Quick Pick presentation fields from an agent-host selection.
 * @param selectedItem Selected agent-host item.
 * @returns Host and installation state consumed by the flow.
 */
export const toAgentHostSelection = (
    selectedItem: AgentHostQuickPickItem
): AgentHostSelection => ({
    host: selectedItem.host,
    installed: selectedItem.installed,
    ...(selectedItem.executablePath
        ? { executablePath: selectedItem.executablePath }
        : {})
});

/**
 * Prompts the user to select an agent host from the supplied detection results.
 * @param detection Agent host detection results in display order.
 * @param deps Optional UI dependencies used to display the QuickPick.
 * @returns The selected host and installation state, or undefined when the user cancels.
 */
export const selectAgentHost = async (
    detection: AgentHostDetectionResult[],
    deps: { showQuickPick?: typeof vscode.window.showQuickPick } = {}
): Promise<AgentHostSelection | undefined> => {
    const items = getAgentHostQuickPickItems(detection);
    const selectedItem = await (deps.showQuickPick ?? vscode.window.showQuickPick)(items);

    if (!selectedItem) {
        return undefined;
    }

    return toAgentHostSelection(selectedItem);
};
