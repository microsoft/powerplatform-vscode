// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ITelemetryErrorEvent, ITelemetryEvent, ITelemetryExceptionData } from "./DataInterfaces";

export interface TelemetryNotificationPayload_TrackEvent {
    kind: 'trackEvent';
    serverType: string;
    event: ITelemetryEvent;
}

export interface TelemetryNotificationPayload_TrackErrorEvent {
    kind: 'trackErrorEvent';
    serverType: string;
    event: ITelemetryErrorEvent;
}

export interface TelemetryNotificationPayload_TrackException {
    kind: 'trackException';
    serverType: string;
    // TODO: ITelemetryExceptionData.error or type Error is not serializable so we won't be able to reconstitute it on the other side.
    // we need to come up with a protocol to simulate a call stack on the client, but include information from the original exception's Error
    exceptionData: ITelemetryExceptionData;
}

export type TelemetryNotificationPayload = TelemetryNotificationPayload_TrackEvent
    | TelemetryNotificationPayload_TrackErrorEvent
    | TelemetryNotificationPayload_TrackException
    ;
