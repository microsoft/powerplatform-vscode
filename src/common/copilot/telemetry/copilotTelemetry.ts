/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { oneDSLoggerWrapper } from "../../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { IProDevCopilotTelemetryData } from "./ITelemetry";


export function sendTelemetryEvent(telemetryData: IProDevCopilotTelemetryData): void {
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
    telemetryDataProperties.isSuggestedPrompt = telemetryData.isSuggestedPrompt ? telemetryData.isSuggestedPrompt : '';
    telemetryDataProperties.subScenario = telemetryData.subScenario ? telemetryData.subScenario : '';
    telemetryDataProperties.userId = telemetryData.userId ? telemetryData.userId : '';
    telemetryDataProperties.environmentId = telemetryData.environmentId ? telemetryData.environmentId : '';
    telemetryDataProperties.websiteId = telemetryData.websiteId ? telemetryData.websiteId : '';
    telemetryDataProperties.copilotGovernanceResponse = telemetryData.copilotGovernanceResponse !== undefined ? String(telemetryData.copilotGovernanceResponse) : '';
    telemetryDataProperties.isGovernanceCheckEnabled = telemetryData.isGovernanceCheckEnabled !== undefined  ? String(telemetryData.isGovernanceCheckEnabled) : '';
    telemetryDataProperties.copilotGovernanceSetting = telemetryData.copilotGovernanceSetting ? telemetryData.copilotGovernanceSetting : '';

    if (telemetryData.error) {
        telemetryDataProperties.eventName = telemetryData.eventName;
        oneDSLoggerWrapper.getLogger().traceError(telemetryData.error.name, telemetryData.error.message, telemetryData.error, telemetryDataProperties, telemetryDataMeasurements);

    } else {
        oneDSLoggerWrapper.getLogger().traceInfo(telemetryData.eventName, telemetryDataProperties, telemetryDataMeasurements);
    }
}
