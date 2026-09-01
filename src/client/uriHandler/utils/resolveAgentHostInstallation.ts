/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { URI_CONSTANTS } from '../constants/uriConstants';
import type { CreateFlowParameters } from '../handlers/createFlowParams';
import { uriHandlerTelemetryEventNames } from '../telemetry/uriHandlerTelemetryEvents';
import { AgentHost, AgentHostDetectionResult, detectAgentHost } from './detectAgentHost';
import { buildResumeMarker, ResumeMarker } from './resumeMarker';

type CreateFlowEventEmitter = (
    eventName: string,
    params: CreateFlowParameters,
    channel: 'agent',
    extraProps?: Record<string, string>
) => void | PromiseLike<void>;

/**
 * Terminal outcomes from the agent-host installation guidance flow.
 */
export type AgentHostInstallResolution =
    | { status: 'resolved'; host: AgentHost }
    | { status: 'reloading' }
    | { status: 'dismissed' };

/**
 * Already-localized copy consumed by the installation guidance flow.
 */
export interface AgentHostInstallationStrings {
    installGuidancePrompt: string;
    viewInstallationGuide: string;
    checkAgain: string;
    dismiss: string;
    reloadWindow: string;
    notNow: string;
}

/**
 * Side effects used by the agent-host installation guidance flow.
 */
export interface ResolveAgentHostInstallationDependencies {
    strings: AgentHostInstallationStrings;
    showInformationMessage(
        message: string,
        ...buttons: string[]
    ): PromiseLike<string | undefined>;
    showWarningMessage(
        message: string,
        ...buttons: string[]
    ): PromiseLike<string | undefined>;
    openExternal(url: string): PromiseLike<void> | void;
    detectHost?(host: AgentHost): Promise<AgentHostDetectionResult>;
    writeResumeMarker(marker: ResumeMarker): PromiseLike<void> | void;
    reloadWindow(): PromiseLike<void> | void;
    emitEvent?: CreateFlowEventEmitter;
    now?(): number;
}

const defaultEmitEvent: CreateFlowEventEmitter = async (eventName, params, channel, extraProps) => {
    // Load telemetry only when the production default is used so Node unit tests remain VS Code-free.
    const { emitCreateFlowEvent } = await import('../telemetry/createFlowTelemetry');
    emitCreateFlowEvent(eventName, params, channel, extraProps);
};

function formatInstallGuidance(
    template: string,
    hostDisplayName: string,
    checkAgainLabel: string
): string {
    return template
        .split('{0}').join(hostDisplayName)
        .split('{1}').join(checkAgainLabel);
}

/**
 * Guides a user through installing and re-detecting an external agent-host CLI.
 * @param host Agent host whose CLI is missing.
 * @param hostDisplayName Localized display name for the host.
 * @param params Deep-link create-flow parameters used by redacted telemetry and resume persistence.
 * @param deps Injected UI and runtime dependencies.
 * @returns The terminal outcome for the calling create-flow handler.
 */
export async function resolveAgentHostInstallation(
    host: AgentHost,
    hostDisplayName: string,
    params: CreateFlowParameters,
    deps: ResolveAgentHostInstallationDependencies
): Promise<AgentHostInstallResolution> {
    const detectHost = deps.detectHost ?? detectAgentHost;
    const emitEvent = deps.emitEvent ?? defaultEmitEvent;
    const now = deps.now ?? Date.now;
    const strings = deps.strings;
    const guidanceMessage = formatInstallGuidance(
        strings.installGuidancePrompt,
        hostDisplayName,
        strings.checkAgain
    );

    await emitEvent(
        uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_PROMPTED,
        params,
        'agent'
    );

    let selection: string | undefined;
    do {
        selection = await deps.showInformationMessage(
            guidanceMessage,
            strings.viewInstallationGuide,
            strings.checkAgain,
            strings.dismiss
        );

        if (selection === strings.viewInstallationGuide) {
            await deps.openExternal(URI_CONSTANTS.AGENT_HOST_INSTALL_GUIDE_URLS[host]);
            await emitEvent(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_GUIDE_OPENED,
                params,
                'agent'
            );
        }
    } while (selection === strings.viewInstallationGuide);

    if (selection === strings.checkAgain) {
        const detection = await detectHost(host);
        const outcome = detection.installed ? 'found' : 'missing';
        await emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RECHECKED,
            params,
            'agent',
            { outcome }
        );

        if (detection.installed) {
            return { status: 'resolved', host };
        }

        const warningSelection = await deps.showWarningMessage(
            guidanceMessage,
            strings.reloadWindow,
            strings.dismiss
        );

        if (warningSelection === strings.reloadWindow) {
            await deps.writeResumeMarker(buildResumeMarker(params, host, now()));
            await emitEvent(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RELOAD_REQUESTED,
                params,
                'agent'
            );
            await deps.reloadWindow();
            return { status: 'reloading' };
        }

        await emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_DISMISSED,
            params,
            'agent'
        );
        return { status: 'dismissed' };
    }

    await emitEvent(
        uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_DISMISSED,
        params,
        'agent'
    );
    return { status: 'dismissed' };
}
