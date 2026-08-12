/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { URI_CONSTANTS } from "../constants/uriConstants";
import { buildCreateFlowTelemetry, CreateFlowParameters } from "../handlers/createFlowParams";

type CreateFlowChannel = 'pac' | 'agent';

function buildCreateFlowEventProperties(
    params: CreateFlowParameters,
    channel: CreateFlowChannel,
    extraProps?: Record<string, string>
): Record<string, string> {
    return {
        ...buildCreateFlowTelemetry(params),
        channel,
        contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
        correlationId: params.correlationId || '',
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
        buildCreateFlowEventProperties(params, channel, extraProps)
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
        buildCreateFlowEventProperties(params, channel, extraProps)
    );
}
