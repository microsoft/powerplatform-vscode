// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ITelemetry } from './ITelemetry';

/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
class NoopTelemetry implements ITelemetry {
    sendTelemetryEvent(eventName: string, properties?: Record<string, string>, measurements?: Record<string, number>): void {
    }

    sendTelemetryErrorEvent(eventName: string, properties?: Record<string, string>, measurements?: Record<string, number>, errorProps?: string[]): void {
    }

    sendTelemetryException(error: Error, properties?: Record<string, string>, measurements?: Record<string, number>): void {
    }
}

export const NoopTelemetryInstance = new NoopTelemetry();
