/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import type * as vscode from 'vscode';
import { URI_HANDLER_STRINGS } from '../constants/uriStrings';
import type { CreateFlowParameters } from '../handlers/createFlowParams';
import { buildAgentHostCommandPlan } from './agentHostCommandPlan';
import { showAgenticCreateConfirmPanel } from './agenticCreateConfirmPanel';
import { confirmAndLaunchAgentHost, ConfirmAndLaunchOutcome } from './confirmAndLaunchAgentHost';
import { AgentHost } from './detectAgentHost';
import { launchAgentHostPlan } from './launchAgentHostPlan';

const AGENT_HOST_COMMAND_PLAN_STRINGS = {
    registerMarketplace: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_REGISTER_MARKETPLACE,
    installPlugin: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_INSTALL_PLUGIN,
    installPluginUserScope: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_INSTALL_PLUGIN_USER_SCOPE,
    launchHost: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_LAUNCH_HOST
};

const AGENT_HOST_DISPLAY_NAMES: Record<AgentHost, string> = {
    [AgentHost.Copilot]: URI_HANDLER_STRINGS.AGENT_HOSTS.COPILOT,
    [AgentHost.Claude]: URI_HANDLER_STRINGS.AGENT_HOSTS.CLAUDE
};

/**
 * Gets the localized display name for a supported agent host.
 * @param host Agent host to describe.
 * @returns Localized host display name.
 */
export function getAgentHostDisplayName(host: AgentHost): string {
    return AGENT_HOST_DISPLAY_NAMES[host];
}

/**
 * Runs the production confirmation and terminal-launch tail for a selected agent host.
 *
 * Both the initial deep-link route and the post-install reload continuation use this function so
 * the resumed flow cannot stop before the same confirmation and terminal handoff.
 *
 * @param host Selected and installed agent host.
 * @param folderUri Target folder selected for the site.
 * @param params Deep-link parameters used by telemetry.
 * @param hostDisplayName Optional already-resolved display name.
 * @returns Whether the command plan was launched or dropped.
 */
export function confirmAndLaunchSelectedAgentHost(
    host: AgentHost,
    folderUri: vscode.Uri,
    params: CreateFlowParameters,
    hostDisplayName: string = getAgentHostDisplayName(host)
): Promise<ConfirmAndLaunchOutcome> {
    return confirmAndLaunchAgentHost(host, hostDisplayName, folderUri, params, {
        buildPlan: (selectedHost, displayName) =>
            buildAgentHostCommandPlan(selectedHost, displayName, AGENT_HOST_COMMAND_PLAN_STRINGS),
        showConfirmPanel: showAgenticCreateConfirmPanel,
        launchPlan: launchAgentHostPlan
    });
}
