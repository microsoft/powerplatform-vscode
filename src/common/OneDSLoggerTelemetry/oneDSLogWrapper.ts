/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import oneDSLoggerInstance from "./oneDSLogger";

class oneDSLogWrapper {

	/// Constructor which also creates an instance of actual logger if telemetry is enabled
	public constructor() {
	}

	public traceInfo(eventName:string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, message?:string) {
		try {
            oneDSLoggerInstance.traceInfo(eventName,customDimension,customMeasurement,message);
		}
		catch (exception) {
			console.warn(exception);
		}
    }
}

const oneDSLogWrapperInstance = new oneDSLogWrapper();

Object.freeze(oneDSLogWrapperInstance);

export default oneDSLogWrapperInstance;