/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../../pac/PacWrapper";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { EnablePacCreateFromHome } from "../../../common/ecs-features/ecsFeatureGates";
import { uriHandlerTelemetryEventNames } from "../telemetry/uriHandlerTelemetryEvents";
import { buildCreateFlowTelemetry, parseCreateFlowParameters } from "./createFlowParams";

/**
 * Handles the `/pacCreate` deep link launched from the Power Pages home page, which will open
 * VS Code into a Power Platform CLI (PAC) create experience.
 *
 * This is a dark, flag-gated scaffold. When {@link EnablePacCreateFromHome} is off (the
 * default) the handler is a no-op. When enabled it only parses the deep-link parameters and
 * emits a "triggered" telemetry event — the actual PAC create behavior (auth, environment
 * selection, folder selection, PAC CLI terminal) is intentionally deferred to a follow-up.
 */
export class PacCreateHandler {
    private readonly pacWrapper: PacWrapper;

    constructor(pacWrapper: PacWrapper) {
        this.pacWrapper = pacWrapper;
    }

    /**
     * Whether the PAC create deep link is enabled via ECS. Defaults to false.
     */
    public static isEnabled(): boolean {
        const enabled = ECSFeaturesClient.getConfig(EnablePacCreateFromHome).enablePacCreateFromHome;
        return enabled === undefined ? false : enabled;
    }

    /**
     * Entry point wired into the URI route map.
     */
    public async handle(uri: vscode.Uri): Promise<void> {
        if (!PacCreateHandler.isEnabled()) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_DISABLED,
                {}
            );
            return;
        }

        try {
            const params = parseCreateFlowParameters(uri);
            const telemetryData = buildCreateFlowTelemetry(params);

            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED,
                telemetryData
            );

            // NOTE: Behavior intentionally not implemented yet. The PAC create flow (auth ->
            // environment -> folder -> PAC CLI terminal) is a follow-up. `pacWrapper` is
            // retained for use by that implementation.
            void this.pacWrapper;
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_FAILED,
                'PAC create deep link failed',
                error instanceof Error ? error : new Error(String(error)),
                {}
            );
        }
    }
}
