// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Interface available for sending telemetry for this extension.
 * This interface also hides the implementation dependencies from consuming code.
 */
export interface ITelemetry {
    sendTelemetryEvent(eventName: string, properties?: Record<string, string>, measurements?: Record<string, number>): void;
    sendTelemetryErrorEvent(eventName: string, properties?: Record<string, string>, measurements?: Record<string, number>, errorProps?: string[]): void;
    sendTelemetryException(error: Error, properties?: Record<string, string>, measurements?: Record<string, number>): void;
}
