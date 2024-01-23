/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { OneDSLogger } from "./oneDSLogger";

//// Wrapper class of oneDSLogger for below purposes
//// 1. Abstracting code from manual trace log APIs. 
//// 2. Constrolling instantiation of 1ds SDK framework code in oneDSLogger.ts

export class oneDSLoggerWrapper {
    private static instance: oneDSLoggerWrapper;
    private static oneDSLoggerIntance : OneDSLogger;

    private constructor(geo?: string) {
        oneDSLoggerWrapper.oneDSLoggerIntance = new OneDSLogger(geo);
    }


    static getLogger(){
        return this.instance;
    }

    static instantiate(geo?:string){
        if(!oneDSLoggerWrapper.instance) {
            oneDSLoggerWrapper.instance = new oneDSLoggerWrapper(geo);
        }
        return this.instance;
    }

	/// Trace info log
	public traceInfo(eventName:string, eventInfo?: object, measurement?: object) {
        try{
            oneDSLoggerWrapper.oneDSLoggerIntance.traceInfo(eventName, eventInfo, measurement);
        }catch (exception) {
			console.warn(exception);
		}
	}

    /// Trace warning log
	public traceWarning(eventName:string, eventInfo?: object, measurement?: object) {
        try{
            oneDSLoggerWrapper.oneDSLoggerIntance.traceWarning(eventName, eventInfo, measurement);
        }catch (exception) {
			console.warn(exception);
		}
	}

    /// Trace exception log
	public traceError(eventName: string, errorMessage: string, exception: Error, eventInfo?:object, measurement?: object) {
        try{
            oneDSLoggerWrapper.oneDSLoggerIntance.traceError(eventName, errorMessage, exception, eventInfo, measurement);
        }catch (exception) {
            console.warn("Caught exception processing the telemetry event: " + exception);
            console.warn(exception);
		}
	}

    /// Trace featureName
	public featureUsage( featureName: string,eventName: string,customDimensions?: object) {
        try{
            oneDSLoggerWrapper.oneDSLoggerIntance.featureUsage(featureName, eventName, customDimensions);
        }catch (exception) {
			console.warn(exception);
		}
	}
    
}   