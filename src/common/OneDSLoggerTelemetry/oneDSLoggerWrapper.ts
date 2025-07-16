/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { isCustomTelemetryEnabled } from "../utilities/Utils";
import { OneDSLogger } from "./oneDSLogger";

//// Wrapper class of oneDSLogger for below purposes
//// 1. Abstracting code from manual trace log APIs.
//// 2. Controlling instantiation of 1ds SDK framework code in oneDSLogger.ts

export class oneDSLoggerWrapper {
    private static instance: oneDSLoggerWrapper;
    private static oneDSLoggerInstance: OneDSLogger;

    private constructor(geo?: string, geoLongName?: string, environment?: string) {
        oneDSLoggerWrapper.oneDSLoggerInstance = new OneDSLogger(geo, geoLongName, environment);
    }


    static getLogger() {
        return this.instance;
    }

    static instantiate(geo?: string, geoLongName?: string, environment?: string) {
        oneDSLoggerWrapper.instance = new oneDSLoggerWrapper(geo, geoLongName, environment);
    }

    /// Trace info log
    public traceInfo(eventName: string, eventInfo?: object, measurement?: object) {
        try {
            if (!isCustomTelemetryEnabled()) return;
            oneDSLoggerWrapper.oneDSLoggerInstance.traceInfo(eventName, eventInfo, measurement);
        } catch (exception) {
            console.warn(exception);
        }
    }

    /// Trace warning log
    public traceWarning(eventName: string, eventInfo?: object, measurement?: object) {
        try {
            if (!isCustomTelemetryEnabled()) return;
            oneDSLoggerWrapper.oneDSLoggerInstance.traceWarning(eventName, eventInfo, measurement);
        } catch (exception) {
            console.warn(exception);
        }
    }

    /// Trace exception log
    public traceError(eventName: string, errorMessage: string, exception: Error, eventInfo?: object, measurement?: object) {
        try {
            if (!isCustomTelemetryEnabled()) return;
            oneDSLoggerWrapper.oneDSLoggerInstance.traceError(eventName, errorMessage, exception, eventInfo, measurement);
        } catch (exception) {
            console.warn("Caught exception processing the telemetry event: " + exception);
            console.warn(exception);
        }
    }

    /// Trace featureName
    public featureUsage(featureName: string, eventName: string, customDimensions?: object) {
        try {
            if (!isCustomTelemetryEnabled()) return;
            oneDSLoggerWrapper.oneDSLoggerInstance.featureUsage(featureName, eventName, customDimensions);
        } catch (exception) {
            console.warn(exception);
        }
    }

}
