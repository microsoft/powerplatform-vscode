/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { isCustomTelemetryEnabled } from "../Utils";
import { OneDSLogger } from "./oneDSLogger";
import { IEvent } from "./IEventTypes";

//// Wrapper class of oneDSLogger for below purposes
//// 1. Abstracting code from manual trace log APIs.
//// 2. Constrolling instantiation of 1ds SDK framework code in oneDSLogger.ts

export class oneDSLoggerWrapper {
    private static instance: oneDSLoggerWrapper;
    private static oneDSLoggerIntance: OneDSLogger;
    private static telemetryCache: IEvent[] = [];

    private constructor(geo?: string) {
        oneDSLoggerWrapper.oneDSLoggerIntance = new OneDSLogger(geo);
    }


    static getLogger() {
        return this.instance;
    }

    static instantiate(geo?: string) {
        oneDSLoggerWrapper.instance = new oneDSLoggerWrapper(geo);
    }

    static isInstantiated() {
        return oneDSLoggerWrapper.instance !== undefined;
    }

    static pushToCache(eventName: string, eventInfo?: object, measurement?: object,errorMessage?:string, error?:Error ) {
        this.telemetryCache.push({eventName, customDimension: eventInfo, customMeasurements: measurement, errorMessage, error} as IEvent);
    }

    static flushCache() {
        this.telemetryCache.forEach(event => {
            if (event.errorMessage || event.error) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                oneDSLoggerWrapper.oneDSLoggerIntance.traceError(event.eventName, event.errorMessage!,event.error!, event.customMeasurements);
            }else{
                oneDSLoggerWrapper.oneDSLoggerIntance.traceInfo(event.eventName, event.customDimension, event.customMeasurements);
            }
        });
        this.telemetryCache = [];
    }

    /// Trace info log
    public traceInfo(eventName: string, eventInfo?: object, measurement?: object) {
        try {
            if (!isCustomTelemetryEnabled()) return;
            oneDSLoggerWrapper.oneDSLoggerIntance.traceInfo(eventName, eventInfo, measurement);
        } catch (exception) {
            console.warn(exception);
        }
    }

    /// Trace warning log
    public traceWarning(eventName: string, eventInfo?: object, measurement?: object) {
        try {
            if (!isCustomTelemetryEnabled()) return;
            oneDSLoggerWrapper.oneDSLoggerIntance.traceWarning(eventName, eventInfo, measurement);
        } catch (exception) {
            console.warn(exception);
        }
    }

    /// Trace exception log
    public traceError(eventName: string, errorMessage: string, exception: Error, eventInfo?: object, measurement?: object) {
        try {
            if (!isCustomTelemetryEnabled()) return;
            oneDSLoggerWrapper.oneDSLoggerIntance.traceError(eventName, errorMessage, exception, eventInfo, measurement);
        } catch (exception) {
            console.warn("Caught exception processing the telemetry event: " + exception);
            console.warn(exception);
        }
    }

    /// Trace featureName
    public featureUsage(featureName: string, eventName: string, customDimensions?: object) {
        try {
            if (!isCustomTelemetryEnabled()) return;
            oneDSLoggerWrapper.oneDSLoggerIntance.featureUsage(featureName, eventName, customDimensions);
        } catch (exception) {
            console.warn(exception);
        }
    }

}
