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
import { emitCreateFlowError, emitCreateFlowEvent } from "../telemetry/createFlowTelemetry";
import { runCreateFlowCommonStages } from "./createFlowCommonStages";

/**
 * Handles the `/pacCreate` deep link launched from the Power Pages home page, which will open
 * VS Code into a Power Platform CLI (PAC) create experience.
 *
 * This is a dark, flag-gated scaffold. When {@link EnablePacCreateFromHome} is off (the
 * default) the handler is a no-op. When enabled it runs the shared authentication, environment,
 * and folder-selection stages. The actual PAC create behavior (parameter collection and PAC CLI
 * terminal launch) is intentionally deferred to a follow-up.
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
        // Parse the (secret-free) deep-link params up front so the redacted telemetry payload
        // is available on every path, including the flag-off and failure cases.
        const params = parseCreateFlowParameters(uri);
        const telemetryData = buildCreateFlowTelemetry(params);

        if (!PacCreateHandler.isEnabled()) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_DISABLED,
                telemetryData
            );
            return;
        }

        try {
            emitCreateFlowEvent(
                uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED,
                params,
                'pac'
            );

            const folderUri = await runCreateFlowCommonStages(
                params,
                'pac',
                telemetryData,
                this.pacWrapper
            );
            if (!folderUri) {
                return;
            }

            // TODO (P1/P2 pac): Implement the channel-specific tail using folderUri.
        } catch (error) {
            emitCreateFlowError(
                uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_FAILED,
                'PAC create deep link failed',
                error,
                params,
                'pac'
            );
        }
    }
}
