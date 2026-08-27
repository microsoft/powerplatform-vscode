/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { URI_HANDLER_STRINGS } from '../constants/uriStrings';
import type { AgentHostBootstrapConfig } from './agentHostBootstrap';
import type { CreateFlowParameters } from '../handlers/createFlowParams';
import { buildAgentHostCommandPlan } from './agentHostCommandPlan';
import { showAgenticCreateConfirmPanel } from './agenticCreateConfirmPanel';
import { confirmAndLaunchAgentHost, ConfirmAndLaunchOutcome } from './confirmAndLaunchAgentHost';
import { AgentHost } from './detectAgentHost';
import { launchAgentHostPlan } from './launchAgentHostPlan';
import {
    AgentHostSetupState,
    detectAgentHostSetup,
    UNKNOWN_AGENT_HOST_SETUP
} from './agentHostSetupPrecheck';
import { emitCreateFlowEvent } from '../telemetry/createFlowTelemetry';
import { uriHandlerTelemetryEventNames } from '../telemetry/uriHandlerTelemetryEvents';

const AGENT_HOST_COMMAND_PLAN_STRINGS = {
    installHost: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_INSTALL_HOST,
    refreshPath: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_REFRESH_PATH,
    verifyHost: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_VERIFY_HOST,
    checkMarketplace: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_CHECK_MARKETPLACE,
    checkPlugin: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_CHECK_PLUGIN,
    registerMarketplace: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_REGISTER_MARKETPLACE,
    installPlugin: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_INSTALL_PLUGIN,
    installPluginUserScope: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_INSTALL_PLUGIN_USER_SCOPE,
    enablePlugin: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_ENABLE_PLUGIN,
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
 * @param allowEdit Whether the confirmation may return to folder/host selection.
 * @param bootstrap Optional missing-host bootstrap configuration.
 * @param siteDescription Maker-provided description passed to the create-site skill.
 * @returns Whether the command plan was launched or dropped.
 */
export async function confirmAndLaunchSelectedAgentHost(
    host: AgentHost,
    folderUri: vscode.Uri,
    params: CreateFlowParameters,
    hostDisplayName: string = getAgentHostDisplayName(host),
    allowEdit = true,
    bootstrap?: AgentHostBootstrapConfig,
    siteDescription = "Create a Power Pages site"
): Promise<ConfirmAndLaunchOutcome> {
    const precheckStartedAt = Date.now();
    const setupState: AgentHostSetupState = bootstrap
        ? UNKNOWN_AGENT_HOST_SETUP
        : await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: URI_HANDLER_STRINGS.PROGRESS.CHECKING_ASSISTANT_SETUP,
                cancellable: false
            },
            () => detectAgentHostSetup(host)
        );
    emitCreateFlowEvent(
        uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_SETUP_CHECKED,
        params,
        'agent',
        {
            host,
            marketplaceState: setupState.marketplace,
            pluginState: setupState.plugin,
            deferredUntilHostInstall: String(Boolean(bootstrap)),
            durationMs: String(Date.now() - precheckStartedAt)
        }
    );

    return confirmAndLaunchAgentHost(host, hostDisplayName, folderUri, params, {
        buildPlan: (selectedHost, displayName) =>
            buildAgentHostCommandPlan(
                selectedHost,
                displayName,
                AGENT_HOST_COMMAND_PLAN_STRINGS,
                bootstrap,
                setupState,
                siteDescription
            ),
        showConfirmPanel: (displayName, folderPath, plan) =>
            showAgenticCreateConfirmPanel(
                displayName,
                folderPath,
                plan,
                undefined,
                allowEdit,
                setupState,
                Boolean(bootstrap),
                () => emitCreateFlowEvent(
                    uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TECHNICAL_DETAILS_OPENED,
                    params,
                    'agent',
                    { host }
                ),
                siteDescription
            ),
        launchPlan: (
            selectedFolderUri,
            plan,
            displayName,
            onProgress,
            setupStateOverride
        ) =>
            launchAgentHostPlan(
                selectedFolderUri,
                plan,
                displayName,
                undefined,
                bootstrap?.shellPath ?? vscode.env.shell,
                setupStateOverride ?? setupState,
                onProgress
            )
    });
}
