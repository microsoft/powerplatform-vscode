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
	public traceInfo(eventName:string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, message?:string) {
        try{
            oneDSLoggerWrapper.oneDSLoggerIntance.traceInfo(eventName, customDimension, customMeasurement, message);
        }catch (exception) {
			console.warn(exception);
		}
	}

    /// Trace warning log
	public traceWarning(eventName:string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, message?:string) {
        try{
            oneDSLoggerWrapper.oneDSLoggerIntance.traceWarning(eventName, customDimension, customMeasurement, message);
        }catch (exception) {
			console.warn(exception);
		}
	}

    /// Trace exception log
	public traceError(eventName:string, error?:Error, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, message?:string) {
        try{
            oneDSLoggerWrapper.oneDSLoggerIntance.traceError(eventName, error, customDimension, customMeasurement, message);
        }catch (exception) {
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