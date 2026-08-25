/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { URI_CONSTANTS } from "../constants/uriConstants";
import { buildCreateFlowTelemetry, CreateFlowParameters } from "../handlers/createFlowParams";
import { uriHandlerTelemetryEventNames } from "./uriHandlerTelemetryEvents";

type CreateFlowChannel = 'pac' | 'agent';

const FUNNEL_EVENT_PROPERTIES: Partial<Record<
    uriHandlerTelemetryEventNames,
    { funnelStage: string; funnelOutcome: string }
>> = {
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_RECEIVED]:
        { funnelStage: 'uriReceipt', funnelOutcome: 'received' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_DISABLED]:
        { funnelStage: 'featureGate', funnelOutcome: 'disabled' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED]:
        { funnelStage: 'contractValidation', funnelOutcome: 'accepted' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_DETECTED]:
        { funnelStage: 'hostDetection', funnelOutcome: 'completed' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED]:
        { funnelStage: 'folderSelection', funnelOutcome: 'selected' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_CANCELLED]:
        { funnelStage: 'folderSelection', funnelOutcome: 'cancelled' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_SELECTED]:
        { funnelStage: 'hostSelection', funnelOutcome: 'selected' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_CONFIRM_ACTION_CLICKED]:
        { funnelStage: 'confirmation', funnelOutcome: 'action' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_BOOTSTRAP_OFFERED]:
        { funnelStage: 'hostBootstrap', funnelOutcome: 'offered' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_BOOTSTRAP_STARTED]:
        { funnelStage: 'hostBootstrap', funnelOutcome: 'started' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_BOOTSTRAP_COMPLETED]:
        { funnelStage: 'hostBootstrap', funnelOutcome: 'completed' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_BOOTSTRAP_RECOVERY]:
        { funnelStage: 'hostBootstrap', funnelOutcome: 'recovery' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_COMMAND_SEQUENCE_RECOVERY]:
        { funnelStage: 'terminalExecution', funnelOutcome: 'recovery' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_PROMPTED]:
        { funnelStage: 'hostInstallFallback', funnelOutcome: 'prompted' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_GUIDE_OPENED]:
        { funnelStage: 'hostInstallFallback', funnelOutcome: 'guideOpened' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RECHECKED]:
        { funnelStage: 'hostInstallFallback', funnelOutcome: 'rechecked' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RELOAD_REQUESTED]:
        { funnelStage: 'hostInstallFallback', funnelOutcome: 'reloadRequested' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RESUMED]:
        { funnelStage: 'hostInstallFallback', funnelOutcome: 'resumed' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_DISMISSED]:
        { funnelStage: 'hostInstallFallback', funnelOutcome: 'dismissed' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_PLUGIN_SEQUENCE_LAUNCHED]:
        { funnelStage: 'terminalHandoff', funnelOutcome: 'pluginSequenceLaunched' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_SAMPLE_PROMPT_SENT]:
        { funnelStage: 'terminalHandoff', funnelOutcome: 'samplePromptSubmitted' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HANDOFF_COMPLETED]:
        { funnelStage: 'extensionHandoff', funnelOutcome: 'completed' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED]:
        { funnelStage: 'flow', funnelOutcome: 'dropped' },
    [uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_FAILED]:
        { funnelStage: 'flow', funnelOutcome: 'failed' }
};

function buildCreateFlowEventProperties(
    eventName: string,
    params: CreateFlowParameters,
    channel: CreateFlowChannel,
    extraProps?: Record<string, string>
): Record<string, string> {
    return {
        ...buildCreateFlowTelemetry(params),
        channel,
        contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
        correlationId: params.correlationId || '',
        referrerSessionId: params.correlationId || '',
        ...(FUNNEL_EVENT_PROPERTIES[eventName as uriHandlerTelemetryEventNames] ?? {}),
        ...extraProps
    };
}

/**
 * Emits a create-flow information event with shared, redacted properties.
 */
export function emitCreateFlowEvent(
    eventName: string,
    params: CreateFlowParameters,
    channel: CreateFlowChannel,
    extraProps?: Record<string, string>
): void {
    oneDSLoggerWrapper.getLogger().traceInfo(
        eventName,
        buildCreateFlowEventProperties(eventName, params, channel, extraProps)
    );
}

/**
 * Emits a create-flow error event with shared, redacted properties.
 */
export function emitCreateFlowError(
    eventName: string,
    message: string,
    error: unknown,
    params: CreateFlowParameters,
    channel: CreateFlowChannel,
    extraProps?: Record<string, string>
): void {
    oneDSLoggerWrapper.getLogger().traceError(
        eventName,
        message,
        error instanceof Error ? error : new Error(String(error)),
        buildCreateFlowEventProperties(eventName, params, channel, extraProps)
    );
}
