/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../telemetry/ITelemetry";

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

interface IPowerPagesTelemetryData {
    eventName: string,
    numberOfFiles?: string,
    fileEntityType?: string,
    durationInMills?: number,
    exception?: Error,
    triggerPoint?: string
}

export function sendTelemetryEvent(telemetry: ITelemetry, telemetryData: IPowerPagesTelemetryData): void {
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

    if (telemetryData.exception) {
        telemetry.sendTelemetryException(telemetryData.exception, telemetryDataProperties, telemetryDataMeasurements);
    } else {
        telemetry.sendTelemetryEvent(telemetryData.eventName, telemetryDataProperties, telemetryDataMeasurements);
    }
}
