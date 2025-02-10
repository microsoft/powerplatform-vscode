/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { oneDSLoggerWrapper } from "../oneDSLoggerWrapper";

// Telemetry Event Names
export const FileDeleteEvent = 'FileDeleteEvent';
export const FileRenameEvent = 'FileRenameEvent';
export const UserFileDeleteEvent = 'UserFileDeleteEvent';
export const UserFileRenameEvent = 'UserFileRenameEvent';
export const ValidateTextDocumentEvent = 'ValidateTextDocumentEvent';
export const FileRenameValidationEvent = 'FileRenameValidationEvent';
export const UpdateEntityPathNamesEvent = 'UpdateEntityPathNamesEvent';
export const CleanupRelatedFilesEvent = 'CleanupRelatedFilesEvent';
export const UpdateEntityNameInYmlEvent = 'UpdateEntityNameInYmlEvent';
export const UserFileCreateEvent = 'UserFileCreateEvent';
export const FileCreateEvent = 'FileCreateEvent';
export const GetWebsiteRecordID = 'getWebsiteRecordId';

interface ITelemetryData {
    eventName: string,
    numberOfFiles?: string,
    fileEntityType?: string,
    durationInMills?: number,
    exception?: Error,
    triggerPoint?: string
    methodName: string
}

export enum TriggerPoint {
    CONTEXT_MENU = "context-menu",
    COMMAND_PALETTE = "command-palette",
}

export function sendTelemetryEvent(telemetryData: ITelemetryData): void {
    const telemetryDataProperties: Record<string, string> = {}
    const telemetryDataMeasurements: Record<string, number> = {}

    if (telemetryData.numberOfFiles) {
        telemetryDataProperties.numberOfFiles = telemetryData.numberOfFiles;
    }

    if (telemetryData.fileEntityType) {
        telemetryDataProperties.fileEntityType = telemetryData.fileEntityType;
    }

    if (telemetryData.durationInMills) {
        telemetryDataMeasurements.durationInMills = telemetryData.durationInMills;
    }

    if (telemetryData.triggerPoint) {
        telemetryDataProperties.triggerPoint = telemetryData.triggerPoint;
    }

    if (telemetryData.methodName) {
        telemetryDataProperties.methodName = telemetryData.methodName;
    }

    if (telemetryData.exception) {
        telemetryDataProperties.eventName = telemetryData.eventName;
        telemetryDataProperties.errorMessage = telemetryData.exception?.message;
        oneDSLoggerWrapper.getLogger().traceError(telemetryDataProperties.eventName, telemetryDataProperties.errorMessage, telemetryData.exception, telemetryDataProperties, telemetryDataMeasurements);
    } else {
        oneDSLoggerWrapper.getLogger().traceInfo(telemetryData.eventName, telemetryDataProperties, telemetryDataMeasurements);
    }
}
