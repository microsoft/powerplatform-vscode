/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface ITelemetryLogger {
/**
	 * Actual implementation that send telemetry event
	 * @param eventName - Telemetry event to send over
	 */
traceInfo(eventName:string, eventInfo?:object, measurement?: object) : void

/**
 * Send warning telemetry event
 * @param eventName - Event to send
 */
traceWarning(eventName:string, eventInfo?:object, measurement?: object) : void
/**
 * Send error telemetry event
 * @param eventName - Event to send
 */
traceError(eventName: string, errorMessage: string, exception: Error, eventInfo?:object , measurement?: object) : void
/**
 * Send featureName and eventName telemetry event
 * @param eventName - Event to send
 */
featureUsage(featureName: string, eventName: string, eventInfo?:object) : void
}