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

    private constructor(region: string, geo?: string) {
        oneDSLoggerWrapper.oneDSLoggerIntance = new OneDSLogger(region, geo);
    }


    static getLogger(){
        return this.instance;
    }

    static instantiate(region:string, geo?:string){
        if(!oneDSLoggerWrapper.instance) {
            oneDSLoggerWrapper.instance = new oneDSLoggerWrapper(region, geo);
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
	public traceError(eventName:string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, message?:string) {
        try{
            oneDSLoggerWrapper.oneDSLoggerIntance.traceError(eventName, customDimension, customMeasurement, message);
        }catch (exception) {
			console.warn(exception);
		}
	}
    
}   