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

export interface IPowerPagesTelemetryData {
    eventName: string,
    numberOfFiles?: string,
    fileEntityType?: string,
    triggerPoint?: string
    methodName:string
}

export interface IPowerPagesMeasurementData {
    durationInMills?: number,
}

export interface IPowerPagesExceptions {
    exception?: Error,
}

export enum TriggerPoint {
    CONTEXT_MENU = "context-menu",
    COMMAND_PALETTE = "command-palette",
}

export function sendTelemetryEvent(telemetry: ITelemetry, telemetryData: IPowerPagesTelemetryData, telemetryMeasurement? :IPowerPagesMeasurementData, telelmetryException?: IPowerPagesExceptions): void {
    const telemetryDataProperties: Record<string, string> = {}
    const telemetryDataMeasurements: Record<string, number> = {}

    if (telemetryData.numberOfFiles) {
        telemetryDataProperties.numberOfFiles = telemetryData.numberOfFiles;
    }

    if (telemetryData.fileEntityType) {
        telemetryDataProperties.fileEntityType = telemetryData.fileEntityType;
    }

    if (telemetryMeasurement && telemetryMeasurement.durationInMills) {
        telemetryDataMeasurements.durationInMills = telemetryMeasurement.durationInMills;
    }

    if(telemetryData.triggerPoint) {
        telemetryDataProperties.triggerPoint = telemetryData.triggerPoint;
    }

    if(telemetryData.methodName) {
        telemetryDataProperties.methodName = telemetryData.methodName;
    }

    if (telelmetryException && telelmetryException.exception) {
        telemetryDataProperties.eventName = telemetryData.eventName;
        telemetryDataProperties.errorMessage = telelmetryException.exception?.message;
        telemetry.sendTelemetryException(telelmetryException.exception, telemetryDataProperties, telemetryDataMeasurements);
    } else {
        telemetry.sendTelemetryEvent(telemetryData.eventName, telemetryDataProperties, telemetryDataMeasurements);
    }
}

