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
import { buildCreateFlowTelemetry, parseCreateFlowParameters } from "./createFlowParams";

/**
 * Handles the `/agenticCreate` deep link launched from the Power Pages home page, which will
 * open VS Code into an agentic (terminal CLI agent host) create experience.
 *
 * This is a dark, flag-gated scaffold. When {@link EnableAgenticCreateFromHome} is off (the
 * default) the handler is a no-op. When enabled it only parses the deep-link parameters and
 * emits a "triggered" telemetry event — the actual agentic behavior (agent-host selection and
 * Power Pages plugin bootstrapping) is intentionally deferred to a follow-up change.
 */
export class AgenticCreateHandler {
    private readonly pacWrapper: PacWrapper;

    constructor(pacWrapper: PacWrapper) {
        this.pacWrapper = pacWrapper;
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
        if (!AgenticCreateHandler.isEnabled()) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_DISABLED,
                {}
            );
            return;
        }

        try {
            const params = parseCreateFlowParameters(uri);
            const telemetryData = buildCreateFlowTelemetry(params);

            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED,
                telemetryData
            );

            // NOTE: Behavior intentionally not implemented yet. The agentic create flow
            // (agent-host detection/selection + Power Pages plugin bootstrapping) is a
            // follow-up. `pacWrapper` is retained for use by that implementation.
            void this.pacWrapper;
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_FAILED,
                'Agentic create deep link failed',
                error instanceof Error ? error : new Error(String(error)),
                {}
            );
        }
    }
}
