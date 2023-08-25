/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ITelemetry } from "../../../client/telemetry/ITelemetry";
import { sendTelemetryEvent } from "../telemetry/copilotTelemetry";
import { CopilotGetEntityFailureEvent } from "../telemetry/telemetryConstants";

export function getEntityNameWeb(telemetry: ITelemetry, sessionID: string, dataverseEntity: string): string {
    let entityName = '';

    try {
        const activeEditor = vscode.window.activeTextEditor;

        if (activeEditor) {
            // TODO: This is a hack to get the entity name. We need to find a better way to get the entity name.
            // Get parsedData['adx_entityname'] || parsedData['adx_targetentitylogicalname'] value from odata call
        }
    } catch (error) {
        sendTelemetryEvent(telemetry, { eventName: CopilotGetEntityFailureEvent, copilotSessionId: sessionID, dataverseEntity: dataverseEntity, error: error as Error });
        entityName = '';
    }

    return entityName;
}

