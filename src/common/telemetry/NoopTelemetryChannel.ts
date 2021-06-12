// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ITelemetryEvent, ITelemetryErrorEvent, ITelemetryExceptionData } from './DataInterfaces';
import { ITelemetryChannel } from './ITelemetryChannel';

/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
class NoopTelemetryChannel implements ITelemetryChannel {
    trackEvent(event: ITelemetryEvent): void {
    }

    trackErrorEvent(event: ITelemetryErrorEvent): void {
    }

    trackException(errorData: ITelemetryExceptionData): void {
    }
}

export const NoopTelemetryChannelInstance = new NoopTelemetryChannel();
