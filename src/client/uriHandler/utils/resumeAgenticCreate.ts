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
    channel: 'agent'
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
    isEnabled(): boolean;
    detectHost(host: AgentHost): Promise<AgentHostDetectionResult>;
    now(): number;
    showInformationMessage(
        message: string,
        ...buttons: string[]
    ): PromiseLike<string | undefined>;
    emitEvent: CreateFlowEventEmitter;
    runStages(params: CreateFlowParameters): PromiseLike<unknown>;
    clearMarker(store: ResumeMarkerStore): PromiseLike<void> | void;
}

function isAgentHost(host: string): host is AgentHost {
    return host === AgentHost.Copilot || host === AgentHost.Claude;
}

function formatResumePrompt(template: string, hostDisplayName: string): string {
    return template.split('{0}').join(hostDisplayName);
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

    if (!deps.isEnabled()
        || !isResumeMarkerFresh(marker, deps.now())
        || !isAgentHost(marker.host)) {
        await deps.clearMarker(deps.store);
        return;
    }

    const detection = await deps.detectHost(marker.host);
    if (!detection.installed) {
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
        await deps.clearMarker(deps.store);
        return;
    }

    const params: CreateFlowParameters = {
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

    try {
        await deps.emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RESUMED,
            params,
            'agent'
        );
        await deps.runStages(params);
    } finally {
        await deps.clearMarker(deps.store);
    }
}
