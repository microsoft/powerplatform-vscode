/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { OneDSLogger } from "./oneDSLogger";

//// Wrapper class of oneDSLogger for below purposes
//// 1. Abstracting code from manual trace log APIs. 
//// 2. Constrolling instantiation of 1ds SDK framework code in oneDSLogger.ts

let instance: oneDSLoggerWrapper;

export class oneDSLoggerWrapper {
    private static oneDSLoggerIntance : OneDSLogger;

    constructor(region: string, geo?: string) {
        if(instance) {
            return this;
        }
        oneDSLoggerWrapper.oneDSLoggerIntance = new OneDSLogger(region, geo);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        instance = this;
    }


    static getLogger(){
        if(!instance) {
            throw new Error("oneDSLoggerWrapper is not initialized");
        }
        return instance;
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