/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../client/telemetry/ITelemetry";
import { sendTelemetryEvent } from "./copilot/telemetry/copilotTelemetry";

export async function getCrossGeoCopilotDataMovementEnabledFlag(bapEndpoint: string, telemetry: ITelemetry): Promise<boolean> {

    try {

        const response = await fetch(bapEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.enabled;
        }

    } catch (error) {
        sendTelemetryEvent(telemetry, { eventName: 'getCrossGeoCopilotDataMovementEnabledFlag', errorMsg: (error as Error).message });
    }

    return false;
}

