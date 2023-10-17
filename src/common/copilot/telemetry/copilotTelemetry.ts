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

    telemetryDataProperties.copilotSessionId = telemetryData.copilotSessionId ? telemetryData.copilotSessionId : '';
    telemetryDataProperties.orgId = telemetryData.orgId ? telemetryData.orgId : '';
    telemetryDataProperties.FeedbackId = telemetryData.FeedbackId ? telemetryData.FeedbackId : '';
    telemetryDataProperties.aibEndpoint = telemetryData.aibEndpoint ? telemetryData.aibEndpoint : '';
    telemetryDataProperties.codeLineCount = telemetryData.codeLineCount ? telemetryData.codeLineCount : '';
    telemetryDataProperties.geoName = telemetryData.geoName ? telemetryData.geoName : '';
    telemetryDataProperties.feedbackType = telemetryData.feedbackType ? telemetryData.feedbackType : '';
    telemetryDataProperties.FeedbackId = telemetryData.FeedbackId ? telemetryData.FeedbackId : '';
    telemetryDataProperties.dataverseEntity = telemetryData.dataverseEntity ? telemetryData.dataverseEntity : '';
    telemetryDataProperties.responseStatus = telemetryData.responseStatus ? telemetryData.responseStatus : '';
    telemetryDataProperties.tokenSize = telemetryData.tokenSize ? telemetryData.tokenSize : '';

    if (telemetryData.error) {
        telemetryDataProperties.eventName = telemetryData.eventName;
        telemetry.sendTelemetryException(telemetryData.error, telemetryDataProperties, telemetryDataMeasurements);
    } else {
        telemetry.sendTelemetryEvent(telemetryData.eventName, telemetryDataProperties, telemetryDataMeasurements);
    }
}
