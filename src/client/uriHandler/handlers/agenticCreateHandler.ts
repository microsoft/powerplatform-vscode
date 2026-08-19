/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../../pac/PacWrapper";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { EnableAgenticCreateFromHome } from "../../../common/ecs-features/ecsFeatureGates";
import { uriHandlerTelemetryEventNames } from "../telemetry/uriHandlerTelemetryEvents";
import { buildCreateFlowTelemetry, CreateFlowParameters, parseCreateFlowParameters } from "./createFlowParams";
import { emitCreateFlowError, emitCreateFlowEvent } from "../telemetry/createFlowTelemetry";
import { runCreateFlowCommonStages } from "./createFlowCommonStages";
import { isSupportedContractVersion } from "./createFlowContractVersion";
import { AgentHost, detectAgentHost } from "../utils/detectAgentHost";
import { selectAgentHost } from "../utils/selectAgentHost";
import {
    AgentHostInstallationStrings,
    resolveAgentHostInstallation
} from "../utils/resolveAgentHostInstallation";
import { ResumeMarkerStore, writeResumeMarker } from "../utils/resumeMarker";
import { isCreateFlowCancellation } from "../utils/createFlowErrors";
import { buildAgentHostCommandPlan } from "../utils/agentHostCommandPlan";
import { showAgenticCreateConfirmPanel } from "../utils/agenticCreateConfirmPanel";
import { launchAgentHostPlan } from "../utils/launchAgentHostPlan";
import { confirmAndLaunchAgentHost, ConfirmAndLaunchOutcome } from "../utils/confirmAndLaunchAgentHost";
import { URI_CONSTANTS } from "../constants/uriConstants";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";

/**
 * Injectable dependencies used by the agent-specific create-flow tail.
 */
export interface AgenticCreateHandlerDependencies {
    detectAgentHost: typeof detectAgentHost;
    selectAgentHost: typeof selectAgentHost;
    resolveAgentHostInstallation: typeof resolveAgentHostInstallation;
    emitCreateFlowEvent: typeof emitCreateFlowEvent;
    confirmAndLaunchAgentHost: (
        host: AgentHost,
        hostDisplayName: string,
        folderUri: vscode.Uri,
        params: CreateFlowParameters
    ) => Promise<ConfirmAndLaunchOutcome>;
}

const AGENT_HOST_COMMAND_PLAN_STRINGS = {
    registerMarketplace: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_REGISTER_MARKETPLACE,
    installPlugin: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_INSTALL_PLUGIN,
    installPluginUserScope: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_INSTALL_PLUGIN_USER_SCOPE,
    launchHost: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.STEP_LAUNCH_HOST
};

const DEFAULT_DEPENDENCIES: AgenticCreateHandlerDependencies = {
    detectAgentHost,
    selectAgentHost,
    resolveAgentHostInstallation,
    emitCreateFlowEvent,
    confirmAndLaunchAgentHost: (host, hostDisplayName, folderUri, params) =>
        confirmAndLaunchAgentHost(host, hostDisplayName, folderUri, params, {
            buildPlan: (selectedHost, displayName) =>
                buildAgentHostCommandPlan(selectedHost, displayName, AGENT_HOST_COMMAND_PLAN_STRINGS),
            showConfirmPanel: showAgenticCreateConfirmPanel,
            launchPlan: launchAgentHostPlan
        })
};

const AGENT_HOST_DISPLAY_NAMES: Record<AgentHost, string> = {
    [AgentHost.Copilot]: URI_HANDLER_STRINGS.AGENT_HOSTS.COPILOT,
    [AgentHost.Claude]: URI_HANDLER_STRINGS.AGENT_HOSTS.CLAUDE
};

const AGENT_HOST_INSTALLATION_STRINGS: AgentHostInstallationStrings = {
    installGuidancePrompt: URI_HANDLER_STRINGS.PROMPTS.AGENT_HOST_INSTALL_GUIDANCE,
    viewInstallationGuide: URI_HANDLER_STRINGS.BUTTONS.VIEW_INSTALLATION_GUIDE,
    checkAgain: URI_HANDLER_STRINGS.BUTTONS.CHECK_AGAIN,
    dismiss: URI_HANDLER_STRINGS.BUTTONS.DISMISS,
    reloadWindow: URI_HANDLER_STRINGS.BUTTONS.RELOAD_WINDOW,
    notNow: URI_HANDLER_STRINGS.BUTTONS.NOT_NOW
};

/**
 * Handles the `/agenticCreate` deep link launched from the Power Pages home page, which will
 * open VS Code into an agentic (terminal CLI agent host) create experience.
 *
 * This is a dark, flag-gated scaffold. When {@link EnableAgenticCreateFromHome} is off (the
 * default) the handler is a no-op. When enabled it runs the shared authentication, environment,
 * and folder-selection stages, then resolves the selected agent host. Power Pages plugin
 * bootstrapping is intentionally deferred to a follow-up change.
 */
export class AgenticCreateHandler {
    private readonly pacWrapper: PacWrapper;
    private readonly resumeMarkerStore?: ResumeMarkerStore;
    private readonly dependencies: AgenticCreateHandlerDependencies;

    constructor(
        pacWrapper: PacWrapper,
        resumeMarkerStore?: ResumeMarkerStore,
        dependencies: AgenticCreateHandlerDependencies = DEFAULT_DEPENDENCIES
    ) {
        this.pacWrapper = pacWrapper;
        this.resumeMarkerStore = resumeMarkerStore;
        this.dependencies = dependencies;
    }

    /**
     * Whether the agentic create deep link is enabled. Defaults to false.
     *
     * The ECS flag is dark by default, so
     * `powerPlatform.experimental.enableAgenticCreateFromHome` acts as a developer-only escape
     * hatch that forces the flow on for local testing. This keeps the shipped ECS fallback off
     * while letting a developer exercise the end-to-end deep link without a code change.
     */
    public static isEnabled(): boolean {
        if (AgenticCreateHandler.isLocalOverrideEnabled()) {
            return true;
        }

        const enabled = ECSFeaturesClient.getConfig(EnableAgenticCreateFromHome).enableAgenticCreateFromHome;
        return enabled === undefined ? false : enabled;
    }

    /**
     * Reads the developer-only local override setting used to force the dark flag on.
     */
    private static isLocalOverrideEnabled(): boolean {
        return vscode.workspace
            .getConfiguration(URI_CONSTANTS.LOCAL_OVERRIDE_SETTING.NAMESPACE)
            .get<boolean>(URI_CONSTANTS.LOCAL_OVERRIDE_SETTING.AGENTIC_CREATE_ENABLED, false) === true;
    }

    /**
     * Entry point wired into the URI route map.
     */
    public async handle(uri: vscode.Uri): Promise<void> {
        // Parse the (secret-free) deep-link params up front so the redacted telemetry payload
        // is available on every path, including the flag-off and failure cases.
        const params = parseCreateFlowParameters(uri);
        const telemetryData = buildCreateFlowTelemetry(params);

        if (!AgenticCreateHandler.isEnabled()) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_DISABLED,
                telemetryData
            );
            return;
        }

        try {
            if (!isSupportedContractVersion(params.version)) {
                emitCreateFlowEvent(
                    uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
                    params,
                    'agent',
                    {
                        reason: 'unsupportedContractVersion',
                        version: params.version ?? ''
                    }
                );
                return;
            }

            emitCreateFlowEvent(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED,
                params,
                'agent'
            );

            const folderUri = await runCreateFlowCommonStages(
                params,
                'agent',
                telemetryData,
                this.pacWrapper
            );
            if (!folderUri) {
                return;
            }

            // Legacy and isolated test callers can omit persistence; production registration supplies it.
            const resumeMarkerStore = this.resumeMarkerStore;
            if (!resumeMarkerStore) {
                return;
            }

            const detection = await Promise.all([
                this.dependencies.detectAgentHost(AgentHost.Copilot),
                this.dependencies.detectAgentHost(AgentHost.Claude)
            ]);
            const selection = await this.dependencies.selectAgentHost(detection);
            if (!selection) {
                this.dependencies.emitCreateFlowEvent(
                    uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
                    params,
                    'agent',
                    { reason: 'hostSelectionCancelled' }
                );
                return;
            }

            this.dependencies.emitCreateFlowEvent(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_SELECTED,
                params,
                'agent',
                {
                    host: selection.host,
                    installed: String(selection.installed)
                }
            );

            if (selection.installed) {
                await this.dependencies.confirmAndLaunchAgentHost(
                    selection.host,
                    AGENT_HOST_DISPLAY_NAMES[selection.host],
                    folderUri,
                    params
                );
                return;
            }

            const resolution = await this.dependencies.resolveAgentHostInstallation(
                selection.host,
                AGENT_HOST_DISPLAY_NAMES[selection.host],
                params,
                {
                    strings: AGENT_HOST_INSTALLATION_STRINGS,
                    showInformationMessage: (message, ...buttons) =>
                        vscode.window.showInformationMessage(message, ...buttons),
                    showWarningMessage: (message, ...buttons) =>
                        vscode.window.showWarningMessage(message, ...buttons),
                    openExternal: async (url) => {
                        await vscode.env.openExternal(vscode.Uri.parse(url));
                    },
                    writeResumeMarker: (marker) =>
                        writeResumeMarker(resumeMarkerStore, marker),
                    reloadWindow: async () => {
                        await vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                }
            );

            switch (resolution.status) {
                case 'resolved':
                    await this.dependencies.confirmAndLaunchAgentHost(
                        selection.host,
                        AGENT_HOST_DISPLAY_NAMES[selection.host],
                        folderUri,
                        params
                    );
                    return;
                case 'reloading':
                case 'dismissed':
                    return;
            }
        } catch (error) {
            emitCreateFlowError(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_FAILED,
                'Agentic create deep link failed',
                error,
                params,
                'agent'
            );

            // The deep link is user-initiated, so an unexpected failure must be visible rather
            // than leaving the user waiting for a flow that has already stopped. The notification
            // is deliberately not awaited: the flow is over, and awaiting would keep the handler
            // pending until the user dismisses the toast.
            if (!isCreateFlowCancellation(error)) {
                const reason = error instanceof Error ? error.message : String(error);
                void vscode.window.showErrorMessage(
                    URI_HANDLER_STRINGS.ERRORS.CREATE_FLOW_FAILED.replace('{0}', reason)
                );
            }
        }
    }
}
