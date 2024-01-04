/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface ITelemetryLogger {
/**
	 * Actual implementation that send telemetry event
	 * @param eventName - Telemetry event to send over
	 */
traceInfo(eventName:string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, message?:string) : void

/**
 * Send warning telemetry event
 * @param eventName - Event to send
 */
traceWarning(eventName:string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, message?:string) : void
/**
 * Send error telemetry event
 * @param eventName - Event to send
 */
traceError(eventName: string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, exceptionMessage?:string, exceptionSource?:string, exceptionDetails?:string) : void
}