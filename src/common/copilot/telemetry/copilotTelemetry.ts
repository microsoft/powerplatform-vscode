/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../../../client/telemetry/ITelemetry";

// Telemetry Event Names
export const CopyCodeToClipboardEvent = 'CopyCodeToClipboardEvent';
export const InsertCodeToEditorEvent = 'InsertCodeToEditorEvent';
export const UserFeedbackThumbsUpEvent = 'ThumbsUpEvent';
export const UserFeedbackThumbsDownEvent = 'ThumbsDownEvent';
export const CopilotResponseSuccessEvent = 'CopilotResponseSuccessEvent';
export const CopilotResponseFailureEvent = 'CopilotResponseFailureEvent';
export const CopilotLoginSuccessEvent = 'CopilotLoginSuccessEvent';
export const CopilotLoginFailureEvent = 'CopilotLoginFailureEvent';
export const CopilotClearChatEvent = 'CopilotClearChatEvent';
export const UserFeedbackSuccessEvent = 'UserFeedbackEventSuccessEvent';
export const UserFeedbackFailureEvent = 'UserFeedbackEventFailureEvent';

interface IProDevCopilotTelemetryData {
    eventName: string,
    durationInMills?: number,
    exception?: Error,
    copilotSessionId?: string,
    orgId?: string,
    FeedbackId?: string
    error?: string
}

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

    if (telemetryData.exception) {
        telemetryDataProperties.eventName = telemetryData.eventName;
        telemetry.sendTelemetryException(telemetryData.exception, telemetryDataProperties, telemetryDataMeasurements);
    } else {
        telemetry.sendTelemetryEvent(telemetryData.eventName, telemetryDataProperties, telemetryDataMeasurements);
    }
}
