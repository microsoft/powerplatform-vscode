/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../../../client/telemetry/ITelemetry";
import { IProDevCopilotTelemetryData } from "./ITelemetry";


export function sendTelemetryEvent(telemetry: ITelemetry, telemetryData: IProDevCopilotTelemetryData): void {
    const telemetryDataProperties: Record<string, string> = {}
    const telemetryDataMeasurements: Record<string, number> = {}

    if (telemetryData.durationInMills) {
        telemetryDataMeasurements.durationInMills = telemetryData.durationInMills;
    }

    if(telemetryData.copilotSessionId) {
        telemetryDataProperties.copilotSessionId = telemetryData.copilotSessionId;
    }

    if(telemetryData.orgId) {
        telemetryDataProperties.orgId = telemetryData.orgId;
    }

    if (telemetryData.error) {
        telemetryDataProperties.eventName = telemetryData.eventName;
        telemetry.sendTelemetryException(telemetryData.error, telemetryDataProperties, telemetryDataMeasurements);
    } else {
        telemetry.sendTelemetryEvent(telemetryData.eventName, telemetryDataProperties, telemetryDataMeasurements);
    }
}
