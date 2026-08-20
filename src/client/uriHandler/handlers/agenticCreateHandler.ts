/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { EnableAgenticCreateFromHome } from "../../../common/ecs-features/ecsFeatureGates";
import { uriHandlerTelemetryEventNames } from "../telemetry/uriHandlerTelemetryEvents";
import { buildCreateFlowTelemetry, CreateFlowParameters, parseCreateFlowParameters } from "./createFlowParams";
import { emitCreateFlowError, emitCreateFlowEvent } from "../telemetry/createFlowTelemetry";
import { isSupportedContractVersion } from "./createFlowContractVersion";
import {
    AgentHost,
    AgentHostDetectionResult,
    detectAgentHost
} from "../utils/detectAgentHost";
import {
    AgenticCreateInputsSelection,
    selectAgenticCreateInputs
} from "../utils/selectAgenticCreateInputs";
import {
    AgentHostInstallationStrings,
    resolveAgentHostInstallation
} from "../utils/resolveAgentHostInstallation";
import { ResumeMarkerStore, writeResumeMarker } from "../utils/resumeMarker";
import { ConfirmAndLaunchOutcome } from "../utils/confirmAndLaunchAgentHost";
import {
    confirmAndLaunchSelectedAgentHost,
    getAgentHostDisplayName
} from "../utils/agenticCreateLaunch";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";

/**
 * Injectable dependencies used by the agent-specific create-flow tail.
 */
export interface AgenticCreateHandlerDependencies {
    detectAgentHost: typeof detectAgentHost;
    selectAgenticCreateInputs: typeof selectAgenticCreateInputs;
    resolveAgentHostInstallation: typeof resolveAgentHostInstallation;
    emitCreateFlowEvent: typeof emitCreateFlowEvent;
    confirmAndLaunchAgentHost: (
        host: AgentHost,
        hostDisplayName: string,
        folderUri: vscode.Uri,
        params: CreateFlowParameters
    ) => Promise<ConfirmAndLaunchOutcome>;
}

const DEFAULT_DEPENDENCIES: AgenticCreateHandlerDependencies = {
    detectAgentHost,
    selectAgenticCreateInputs,
    resolveAgentHostInstallation,
    emitCreateFlowEvent,
    confirmAndLaunchAgentHost: (host, hostDisplayName, folderUri, params) =>
        confirmAndLaunchSelectedAgentHost(host, folderUri, params, hostDisplayName)
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
 * default) the handler is a no-op. When enabled it collects folder and host in one multi-step
 * flow, then confirms and launches the selected agent host. Authentication is intentionally left
 * to the selected agent experience.
 */
export class AgenticCreateHandler {
    private readonly resumeMarkerStore?: ResumeMarkerStore;
    private readonly dependencies: AgenticCreateHandlerDependencies;

    constructor(
        resumeMarkerStore?: ResumeMarkerStore,
        dependencies: AgenticCreateHandlerDependencies = DEFAULT_DEPENDENCIES
    ) {
        this.resumeMarkerStore = resumeMarkerStore;
        this.dependencies = dependencies;
    }

    /**
     * Whether the agentic create deep link is enabled via ECS. Defaults to false.
     */
    public static isEnabled(): boolean {
        const enabled = ECSFeaturesClient.getConfig(EnableAgenticCreateFromHome).enableAgenticCreateFromHome;
        return enabled === undefined ? false : enabled;
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

            // Legacy and isolated test callers can omit persistence; production registration supplies it.
            const resumeMarkerStore = this.resumeMarkerStore;
            if (!resumeMarkerStore) {
                return;
            }

            let detection: AgentHostDetectionResult[] = await Promise.all([
                this.dependencies.detectAgentHost(AgentHost.Copilot),
                this.dependencies.detectAgentHost(AgentHost.Claude)
            ]);
            let selectionToEdit: AgenticCreateInputsSelection | undefined;

            for (;;) {
                const inputs = selectionToEdit
                    ? await this.dependencies.selectAgenticCreateInputs(detection, selectionToEdit)
                    : await this.dependencies.selectAgenticCreateInputs(detection);
                if (inputs.status === "cancelled") {
                    if (inputs.step === "folder") {
                        this.dependencies.emitCreateFlowEvent(
                            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_CANCELLED,
                            params,
                            'agent'
                        );
                    } else {
                        this.dependencies.emitCreateFlowEvent(
                            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED,
                            params,
                            'agent'
                        );
                    }
                    this.dependencies.emitCreateFlowEvent(
                        uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
                        params,
                        'agent',
                        { reason: inputs.step === "folder" ? "folderSelectionCancelled" : "hostSelectionCancelled" }
                    );
                    return;
                }

                const { folderUri, hostSelection } = inputs;
                let confirmedHostSelection = hostSelection;
                this.dependencies.emitCreateFlowEvent(
                    uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED,
                    params,
                    'agent'
                );
                this.dependencies.emitCreateFlowEvent(
                    uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_SELECTED,
                    params,
                    'agent',
                    {
                        host: hostSelection.host,
                        installed: String(hostSelection.installed)
                    }
                );

                if (!hostSelection.installed) {
                    const resolution = await this.dependencies.resolveAgentHostInstallation(
                        hostSelection.host,
                        getAgentHostDisplayName(hostSelection.host),
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
                    if (resolution.status !== 'resolved') {
                        return;
                    }

                    confirmedHostSelection = { ...hostSelection, installed: true };
                    detection = detection.map(result =>
                        result.host === hostSelection.host
                            ? { ...result, installed: true }
                            : result
                    );
                }

                const outcome = await this.dependencies.confirmAndLaunchAgentHost(
                    confirmedHostSelection.host,
                    getAgentHostDisplayName(confirmedHostSelection.host),
                    folderUri,
                    params
                );
                if (outcome.status !== 'edit') {
                    return;
                }

                selectionToEdit = {
                    folderUri,
                    hostSelection: confirmedHostSelection
                };
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
            const reason = error instanceof Error ? error.message : String(error);
            void vscode.window.showErrorMessage(
                URI_HANDLER_STRINGS.ERRORS.CREATE_FLOW_FAILED.replace('{0}', reason)
            );
        }
    }
}
