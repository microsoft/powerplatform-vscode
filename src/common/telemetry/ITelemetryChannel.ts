// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ITelemetryErrorEvent, ITelemetryEvent, ITelemetryExceptionData } from "./DataInterfaces";

/**
 */
 export interface ITelemetryChannel {
    trackEvent(event: ITelemetryEvent): void;
    trackErrorEvent(event: ITelemetryErrorEvent): void;
    trackException(exceptionData: ITelemetryExceptionData): void;
}
