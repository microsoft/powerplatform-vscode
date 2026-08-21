/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import type * as vscode from "vscode";
import type { CreateFlowParameters } from "../handlers/createFlowParams";
import { uriHandlerTelemetryEventNames } from "../telemetry/uriHandlerTelemetryEvents";
import type { PlannedCommand } from "./agentHostCommandPlan";
import type { AgentHost } from "./detectAgentHost";
import type { ConfirmDecision } from "./agenticCreateConfirmPanel";
import type { LaunchAgentHostPlanResult } from "./launchAgentHostPlan";

type CreateFlowEventEmitter = (
    eventName: string,
    params: CreateFlowParameters,
    channel: 'agent',
    extraProps?: Record<string, string>
) => void | PromiseLike<void>;

/**
 * Terminal outcome of the confirm-and-launch step.
 */
export type ConfirmAndLaunchOutcome =
    | { status: 'launched' }
    | { status: 'edit' }
    | { status: 'recovery'; result: Extract<LaunchAgentHostPlanResult, { status: 'recovery' }> }
    | { status: 'dropped' };

/**
 * Side effects used by {@link confirmAndLaunchAgentHost}. The VS Code-touching pieces (panel and
 * terminal) are injected so the orchestration and telemetry stay unit-testable without VS Code.
 */
export interface ConfirmAndLaunchDependencies {
    buildPlan: (host: AgentHost, hostDisplayName: string) => PlannedCommand[];
    showConfirmPanel: (
        hostDisplayName: string,
        folderPath: string,
        plan: PlannedCommand[]
    ) => Promise<ConfirmDecision>;
    launchPlan: (
        folderUri: vscode.Uri,
        plan: PlannedCommand[],
        hostDisplayName: string
    ) => Promise<LaunchAgentHostPlanResult>;
    emitEvent?: CreateFlowEventEmitter;
}

const defaultEmitEvent: CreateFlowEventEmitter = async (eventName, params, channel, extraProps) => {
    // Load telemetry only when the production default is used so Node unit tests remain VS Code-free.
    const { emitCreateFlowEvent } = await import('../telemetry/createFlowTelemetry');
    emitCreateFlowEvent(eventName, params, channel, extraProps);
};

/**
 * Builds the host command plan, previews it in the confirmation panel, and — only on explicit
 * approval — launches it in a terminal. Emits launch telemetry on start and drop telemetry when
 * the user cancels or dismisses the panel.
 *
 * @param host Selected agent host.
 * @param hostDisplayName Localized display name for the host.
 * @param folderUri Target folder the plan runs in.
 * @param params Deep-link create-flow parameters used by redacted telemetry.
 * @param deps Injected side effects.
 * @returns Whether the plan was launched or the flow was dropped.
 */
export async function confirmAndLaunchAgentHost(
    host: AgentHost,
    hostDisplayName: string,
    folderUri: vscode.Uri,
    params: CreateFlowParameters,
    deps: ConfirmAndLaunchDependencies
): Promise<ConfirmAndLaunchOutcome> {
    const emitEvent = deps.emitEvent ?? defaultEmitEvent;
    const plan = deps.buildPlan(host, hostDisplayName);
    const decision = await deps.showConfirmPanel(hostDisplayName, folderUri.fsPath, plan);

    if (decision !== 'dismissed') {
        await emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_CONFIRM_ACTION_CLICKED,
            params,
            'agent',
            { host, action: decision }
        );
    }

    if (decision === 'start') {
        const includesBootstrap = plan.some(command => command.kind === 'installHost');
        if (includesBootstrap) {
            await emitEvent(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_BOOTSTRAP_STARTED,
                params,
                'agent',
                { host }
            );
        }

        const launchResult = await deps.launchPlan(folderUri, plan, hostDisplayName);
        if (launchResult.status === 'recovery') {
            await emitEvent(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_BOOTSTRAP_RECOVERY,
                params,
                'agent',
                {
                    host,
                    reason: launchResult.reason,
                    commandKind: launchResult.failedCommand?.kind ?? '',
                    exitCodeCategory: launchResult.exitCode === undefined ? 'unknown' : 'nonZero'
                }
            );
            return { status: 'recovery', result: launchResult };
        }
        if (includesBootstrap) {
            await emitEvent(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_BOOTSTRAP_COMPLETED,
                params,
                'agent',
                { host }
            );
        }

        await emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_PLUGIN_SEQUENCE_LAUNCHED,
            params,
            'agent',
            { host }
        );
        await emitEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_SAMPLE_PROMPT_SENT,
            params,
            'agent',
            { host }
        );
        return { status: 'launched' };
    }

    if (decision === 'edit') {
        return { status: 'edit' };
    }

    await emitEvent(
        uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
        params,
        'agent',
        { reason: decision === 'cancel' ? 'confirmCancelled' : 'confirmDismissed' }
    );
    return { status: 'dropped' };
}
