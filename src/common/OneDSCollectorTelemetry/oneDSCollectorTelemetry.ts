/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { AppInsightsCore, type IExtendedConfiguration } from "@microsoft/1ds-core-js";
import { PostChannel, type IChannelConfiguration, type IXHROverride } from "@microsoft/1ds-post-js";
import { ITelemetryLogger } from "./ITelemetryLogger";
import { EventType } from "./telemetryConstants";

export class OneDSCollectorTelemetry implements ITelemetryLogger{

    private readonly appInsightsCore = new AppInsightsCore();
	private readonly postChannel: PostChannel = new PostChannel();
    
    private readonly fetchHttpXHROverride: IXHROverride = {
        sendPOST: (payload, oncomplete, sync) => {
            const telemetryRequestData =
                typeof payload.data === "string"
                    ? payload.data
                    : new TextDecoder().decode(payload.data);
    
            const requestInit: RequestInit = {
                body: telemetryRequestData,
                method: "POST",
                headers: payload.headers,
                credentials: "include",
            };
            fetch(payload.urlString, requestInit)
                .then((response) => {
                    const headerMap: Record<string, string> = {};
                    response.headers.forEach((value: string, name: string) => {
                        headerMap[name] = value;
                    });
    
                    if (response.body) {
                        response
                            .text()
                            .then((text) => {
                                oncomplete(response.status, headerMap, text);
                            })
                            .catch((error) => {
                                // Something wrong with the response body? Play it safe by passing the response status; don't try to
                                // explicitly re-send the telemetry events by specifying status 0.
                                oncomplete(response.status, headerMap, "");
                            });
                    } else {
                        oncomplete(response.status, headerMap, "");
                    }
                })
                .catch((error) => {
                    console.error("Error issuing telemetry request:", error);
                    // Error sending the request. Set the status to 0 so that the events can be retried.
                    oncomplete(0, {});
                });
        },
    };
    
    public constructor() {

        const channelConfig: IChannelConfiguration = {
			alwaysUseXhrOverride: true,
			httpXHROverride: this.fetchHttpXHROverride,
		};

		const instrumentationKey = '';

		// Configure App insights core to send to collector
		const coreConfig: IExtendedConfiguration = {
			instrumentationKey,
			loggingLevelConsole: 0, // Do not log to console
			disableDbgExt: true, // Small perf optimization
			extensions: [
				// Passing no channels here when the user opts out of telemetry would be ideal, completely ensuring telemetry
				// could not be sent out at all. Could be a later improvement.
				this.postChannel,
			],
			extensionConfig: {
				[this.postChannel.identifier]: channelConfig,
			},
		};

		if ((coreConfig.instrumentationKey ?? "") !== "") {
			this.appInsightsCore.initialize(coreConfig, []);
		}
	}

    
	/// Trace info log
	public traceInfo(eventName:string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, message?:string) {
		var event = {
			name: "CustomEvent",
			data: {
                eventName: eventName,
				eventType: EventType.INFO,
				message: message,
                customDimension: customDimension,
                customMeasurement: customMeasurement
			}
		};

		this.appInsightsCore.track(event);
	}

	/// Trace warning log
	public traceWarning(eventName:string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, message?:string) {
		var event = {
			name: "CustomEvent",
			data: {
                eventName: eventName,
				eventType: EventType.WARNING,
				message: message,
                customDimension: customDimension,
                customMeasurement: customMeasurement
			}
		};

		this.appInsightsCore.track(event);
	}

    // Trace error log
	public traceError(eventName: string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, exceptionMessage?:string, exceptionSource?:string, exceptionDetails?:string) {
		var event = {
			name: "CustomEvent",
			data: {
                eventName: eventName,
				eventType: EventType.ERROR,
				exceptionMessage: exceptionMessage,
                exceptionDetails: exceptionDetails,
                exceptionSource: exceptionSource,
                customDimension: customDimension,
                customMeasurement: customMeasurement
			}
		};

		this.appInsightsCore.track(event);
	}
}