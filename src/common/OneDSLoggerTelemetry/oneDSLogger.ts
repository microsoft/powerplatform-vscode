/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { AppInsightsCore, type IExtendedConfiguration } from "@microsoft/1ds-core-js";
import { PostChannel, type IChannelConfiguration, type IXHROverride } from "@microsoft/1ds-post-js";
import { ITelemetryLogger } from "./ITelemetryLogger";
import { EventType } from "./telemetryConstants";
import * as vscode from "vscode";
import {getExtensionType, getExtensionVersion} from "../../common/Utils";
import { EXTENSION_ID } from "../../client/constants";
import {EventTableName} from "./EventContants";

interface IInstrumentationSettings {
    endpointURL: string;
    instrumentationKey: string;
}

export class OneDSLogger implements ITelemetryLogger{

    private readonly appInsightsCore :AppInsightsCore;
	private readonly postChannel: PostChannel;


    private readonly fetchHttpXHROverride: IXHROverride = {
        sendPOST: (payload, oncomplete) => {
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
                                console.error("Error inside telemetry request body:", error);
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
    
    public constructor(geo?:string ) {

        this.appInsightsCore = new AppInsightsCore();
        this.postChannel = new PostChannel();

        const channelConfig: IChannelConfiguration = {
			alwaysUseXhrOverride: true,
			httpXHROverride: this.fetchHttpXHROverride,
		};

        const instrumentationSetting : IInstrumentationSettings= OneDSLogger.getInstrumentationSettings(geo); // Need to replace with actual data

		// Configure App insights core to send to collector
		const coreConfig: IExtendedConfiguration = {
			instrumentationKey: instrumentationSetting.instrumentationKey,
			loggingLevelConsole: 0, // Do not log to console
			disableDbgExt: true, // Small perf optimization
			extensions: [
				// Passing no channels here when the user opts out of telemetry would be ideal, completely ensuring telemetry
				// could not be sent out at all.
				this.postChannel,
			],
            endpointUrl: instrumentationSetting.endpointURL,
			extensionConfig: {
				[this.postChannel.identifier]: channelConfig,
			},

		};

		if ((coreConfig.instrumentationKey ?? "") !== "") {
			this.appInsightsCore.initialize(coreConfig, []);
		}
        this.appInsightsCore.addTelemetryInitializer((envelope) => {
            OneDSLogger.populateCommonAttributes(envelope);
        });
	}

    private static getInstrumentationSettings(geo?:string): IInstrumentationSettings {
        // eslint-disable-next-line @typescript-eslint/no-inferrable-types
        const region:string = "test"; // TODO: Remove it from here and replace it with value getting from build. Check gulp.mjs (setTelemetryTarget)
        const instrumentationSettings:IInstrumentationSettings = {
            endpointURL: 'https://self.pipe.aria.int.microsoft.com/OneCollector/1.0/',
            instrumentationKey: 'bd47fc8d971f4283a6686ec46fd48782-bdef6c1c-75ab-417c-a1f7-8bbe21e12da6-7708'
        };
        switch (region) {
            case 'tie':
            case 'test':
            case 'preprod':
                break;
            case 'prod':
            case 'preview':
              switch (geo) {
                case 'eu':
                    instrumentationSettings.endpointURL = '' //prod endpoint;
                    instrumentationSettings.instrumentationKey = '' //prod key;
                  break;
                default:
                    instrumentationSettings.endpointURL = '' //prod endpoint;
                    instrumentationSettings.instrumentationKey = '' //prod key;
              }
              break;
            case 'gov':
            case 'high':
            case 'dod':
            case 'mooncake':
                instrumentationSettings.endpointURL = '' //prod endpoint;
                instrumentationSettings.instrumentationKey = '' //prod key;
              break;
            case 'ex':
            case 'rx':
            default:
              break;
          }    
        return instrumentationSettings;
      }
    
	/// Trace info log
	public traceInfo(eventName:string, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, message?:string) {
		const event = {
			name: EventTableName.CUSTOM_EVENT,
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
		const event = {
			name: EventTableName.CUSTOM_EVENT,
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
	public traceError(eventName: string, error?:Error, customDimension?:Record<string, string>, customMeasurement?: Record<string, number>, exceptionMessage?:string, exceptionSource?:string, exceptionDetails?:string) {
		const event = {
			name: EventTableName.CUSTOM_EVENT,
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

    /// Populate attributes that are common to all events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static populateCommonAttributes(envelope: any) {	
		envelope.data = envelope.data || {}; // create data nested object if doesn't exist already'

		envelope.data.SessionId = vscode.env.sessionId;
        envelope.data.surface = getExtensionType();
        envelope.data.extensionVersion = getExtensionVersion();
        envelope.data.extensionName = EXTENSION_ID;
        envelope.data.dataDomain = vscode.env.appHost;
        envelope.data.cloudRoleName = vscode.env.appName;
        envelope.data.vscodeVersion = vscode.version;
        envelope.data.vscodeMachineId = vscode.env.machineId
	}

    public flushAndTeardown(): void {
        this.appInsightsCore.flush();
    }
}