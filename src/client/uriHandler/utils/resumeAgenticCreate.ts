/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import type { CreateFlowParameters } from '../handlers/createFlowParams';
import { uriHandlerTelemetryEventNames } from '../telemetry/uriHandlerTelemetryEvents';
import { AgentHost, AgentHostDetectionResult } from './detectAgentHost';
import {
    isResumeMarkerFresh,
    readResumeMarker,
    ResumeMarkerStore
} from './resumeMarker';

type CreateFlowEventEmitter = (
    eventName: string,
    params: CreateFlowParameters,
    channel: 'agent',
    extraProps?: Record<string, string>
) => void | PromiseLike<void>;

type CreateFlowErrorEmitter = (
    eventName: string,
    message: string,
    error: unknown,
    params: CreateFlowParameters,
    channel: 'agent',
    extraProps?: Record<string, string>
) => void | PromiseLike<void>;

/**
 * Localized strings consumed by the resume-after-reload flow.
 */
export interface ResumeAgenticCreateStrings {
    resumePrompt: string;
    resume: string;
    notNow: string;
    hostDisplayNames: Record<AgentHost, string>;
}

/**
 * Side effects used by the resume-after-reload flow.
 */
export interface ResumeAgenticCreateDependencies {
    store: ResumeMarkerStore;
    strings: ResumeAgenticCreateStrings;
    detectHost(host: AgentHost): Promise<AgentHostDetectionResult>;
    now(): number;
    showInformationMessage(
        message: string,
        ...buttons: string[]
    ): PromiseLike<string | undefined>;
    emitEvent: CreateFlowEventEmitter;
    emitError?: CreateFlowErrorEmitter;
    runStages(params: CreateFlowParameters, host: AgentHost): PromiseLike<unknown>;
    clearMarker(store: ResumeMarkerStore): PromiseLike<void> | void;
}

function isAgentHost(host: string): host is AgentHost {
    return host === AgentHost.Copilot || host === AgentHost.Claude;
}

function formatResumePrompt(template: string, hostDisplayName: string): string {
    return template.split('{0}').join(hostDisplayName);
}

function buildResumeParams(marker: {
    environmentId: string | null;
    orgUrl: string | null;
    websiteId: string | null;
    source: string | null;
    host: string;
    correlationId: string | null;
}): CreateFlowParameters {
    return {
        environmentId: marker.environmentId,
        orgUrl: marker.orgUrl,
        region: null,
        tenantId: null,
        websiteId: marker.websiteId,
        source: marker.source,
        agentHost: marker.host,
        version: null,
        correlationId: marker.correlationId
    };
}

/**
 * Resumes a pending agentic-create flow after a VS Code window reload.
 * @param deps Injected persistence, UI, telemetry, and create-stage dependencies.
 */
export async function resumeAgenticCreate(
    deps: ResumeAgenticCreateDependencies
): Promise<void> {
    const marker = readResumeMarker(deps.store);
    if (!marker) {
        return;
    }
    const params = buildResumeParams(marker);

    if (!isResumeMarkerFresh(marker, deps.now())) {
        await deps.emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
            params,
            'agent',
            { reason: 'resumeMarkerStale' }
        );
        await deps.clearMarker(deps.store);
        return;
    }
    if (!isAgentHost(marker.host)) {
        await deps.emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
            params,
            'agent',
            { reason: 'resumeHostUnsupported' }
        );
        await deps.clearMarker(deps.store);
        return;
    }

    // The short-lived marker is written only after the gated Agentic Create flow has already
    // started, so resuming it must not depend on ECS being initialized again after reload.
    const detection = await deps.detectHost(marker.host);
    if (!detection.installed) {
        await deps.emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
            params,
            'agent',
            { reason: 'resumeHostMissing', host: marker.host }
        );
        await deps.clearMarker(deps.store);
        return;
    }

    const selection = await deps.showInformationMessage(
        formatResumePrompt(
            deps.strings.resumePrompt,
            deps.strings.hostDisplayNames[marker.host]
        ),
        deps.strings.resume,
        deps.strings.notNow
    );
    if (selection !== deps.strings.resume) {
        await deps.emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
            params,
            'agent',
            {
                reason: selection === deps.strings.notNow
                    ? 'resumeDeclined'
                    : 'resumeDismissed',
                host: marker.host
            }
        );
        await deps.clearMarker(deps.store);
        return;
    }

    try {
        await deps.emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RESUMED,
            params,
            'agent'
        );
        await deps.runStages(params, marker.host);
    } catch (error) {
        await deps.emitError?.(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_FAILED,
            'Agentic create resume failed',
            error,
            params,
            'agent',
            { failureStage: 'resume' }
        );
        throw error;
    } finally {
        await deps.clearMarker(deps.store);
    }
}
