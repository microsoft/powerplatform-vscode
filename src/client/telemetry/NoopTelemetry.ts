/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

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
