/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion*/

import { AppInsightsCore, type IExtendedConfiguration } from "@microsoft/1ds-core-js";
import { PostChannel, type IChannelConfiguration, type IXHROverride } from "@microsoft/1ds-post-js";
import { ITelemetryLogger } from "./ITelemetryLogger";
import { EventType, Severity } from "./telemetryConstants";
import * as vscode from "vscode";
import {getExtensionType, getExtensionVersion} from "../../common/Utils";
import { EXTENSION_ID } from "../../client/constants";
import {OneDSCollectorEventName} from "./EventContants";

interface IInstrumentationSettings {
    endpointURL: string;
    instrumentationKey: string;
}

export class OneDSLogger implements ITelemetryLogger{

    private readonly appInsightsCore :AppInsightsCore;
	private readonly postChannel: PostChannel;

    private readonly regexPatternsToRedact = [
        /secret["\\ ']*[:=]+["\\ ']*([a-zA-Z0-9]*)/igm,
        /code["\\ ']*[:=]+["\\ ']*([a-zA-Z0-9]*)/igm,
        /key["\\ ']*[:=]+["\\ ']*([a-zA-Z0-9]*)/igm,
        /token["\\ ']*[:=]+["\\ ']*([a-zA-Z0-9]*)/igm,
        /session["\\ ']*[:=]+["\\ ']*([a-zA-Z0-9]*)/igm,
        /password["\\ ']*[:=]+["\\ ']*([a-zA-Z0-9]*)/igm,
        /passwd["\\ ']*[:=]+["\\ ']*([a-zA-Z0-9]*)/igm,
        /connection["\\ ']*[:=]+["\\ ']*([a-zA-Z0-9]*)/igm,
        /sig["\\ ']*[:=]+["\\ ']*([a-zA-Z0-9]*)/igm
    ]

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.appInsightsCore.addTelemetryInitializer(this.populateCommonAttributes());
	}

    private static getInstrumentationSettings(geo?:string): IInstrumentationSettings {
        // eslint-disable-next-line @typescript-eslint/no-inferrable-types
        const region:string = "test"; // TODO: Remove it from here and replace it with value getting from build. Check gulp.mjs (setTelemetryTarget)
        const instrumentationSettings:IInstrumentationSettings = {
            endpointURL: 'https://us-mobile.events.data.microsoft.com/OneCollector/1.0/',
            instrumentationKey: '197418c5cb8c4426b201f9db2e87b914-87887378-2790-49b0-9295-51f43b6204b1-7172'
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
	public traceInfo(eventName:string, eventInfo?:object, measurement?: object) {
		const event = {
			name: OneDSCollectorEventName.VSCODE_EVENT,
			data: {
                eventName: eventName,
                eventType: EventType.TRACE,
                severity: Severity.INFO,
                eventInfo: JSON.stringify(eventInfo!),
                measurement:  JSON.stringify(measurement!)
			}
		};

		this.appInsightsCore.track(event);
	}

	/// Trace warning log
	public traceWarning(eventName:string, eventInfo?: object, measurement?: object) {
		const event = {
			name: OneDSCollectorEventName.VSCODE_EVENT,
			data: {
                eventName: eventName,
				eventType: EventType.TRACE,
                severity: Severity.WARN,
                eventInfo: JSON.stringify(eventInfo!),
                measurement:  JSON.stringify(measurement!)
			}
		};

		this.appInsightsCore.track(event);
	}

    // Trace error log
	public traceError(eventName: string, errorMessage: string, exception: Error, eventInfo?:object, measurement?: object) {
       // if (eventName === 'WebExtensionSetVscodeWorkspaceStateFailed') {
            console.log("here in onedslogger eventName--"+eventName);
            console.log("here in onedslogger errorMessage--"+errorMessage);
            console.log("here in onedslogger exception--"+exception);
            console.log("here in onedslogger eventInfo--"+eventInfo);
            console.log("here in onedslogger measurement--"+measurement);    
        //}
		const event = {
			name: OneDSCollectorEventName.VSCODE_EVENT,
			data: {
                eventName: eventName,
				eventType: EventType.TRACE,
                severity: Severity.ERROR,
				message: errorMessage!,
                errorName: exception ? exception.name!: 'Exception',
                errorStack: JSON.stringify(exception!),
                eventInfo: JSON.stringify(eventInfo!),
                measurement:  JSON.stringify(measurement!)
			}
		};
        this.appInsightsCore.track(event);
    }

    public  featureUsage(
        featureName: string,
        eventName: string,
        customDimensions?: object
      ) {

        const event = {
			name: OneDSCollectorEventName.VSCODE_EVENT,
			data: {
                eventName: 'Portal_Metrics_Event',
				eventType: EventType.TRACE,
                severity: Severity.INFO,
                eventInfo: JSON.stringify({
                    featureName: featureName,
                    customDimensions: customDimensions,
                    eventName: eventName
                })
			}
		};
        this.appInsightsCore.track(event);
    }

    /// Populate attributes that are common to all events
	private populateCommonAttributes() {	
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (envelope:any) => {
			try {
                    envelope.data = envelope.data || {}; // create data nested object if doesn't exist already'

                    envelope.data.clientSessionId = vscode.env.sessionId;
                    envelope.data.vscodeSurface = getExtensionType();
                    envelope.data.vscodeMachineId = vscode.env.machineId;
                    envelope.data.vscodeExtensionName = EXTENSION_ID;
                    envelope.data.vscodeExtensionVersion = getExtensionVersion();
                    envelope.data.vscodeVersion = vscode.version;
                    envelope.data.domain = vscode.env.appHost;
                    // envelope.data.timestamp = envelope.ext.user.locale;
                    // envelope.data.userLocale = envelope.ext.user.locale;
                    // envelope.data.userTimeZone = envelope.ext.loc.tz;
                    // envelope.data.appLanguage = envelope.ext.app.locale;

                    // At the end of event enrichment, redact the sensitive data for all the applicable fields
                  //  envelope = this.redactSensitiveDataFromEvent(envelope);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            catch (exception:any) 
			{
				// Such exceptions are likely if we are trying to process event attributes which don't exist
				// In such cases, only add common attributes and current exception details, and avoid processing the event attributes further
				// However, do log the baseData of the event along with its name in the exception event that gets sent out in this scenario
				console.warn("Caught exception processing the telemetry event: " + envelope.name);
				console.warn(exception.message);

				this.traceExceptionInEventProcessing();
				return false;
			}
        }
	}

    //// Redact Sensitive data for the fields susceptible to contain codes/tokens/keys/secrets etc.
	//// This is done post event enrichment is complete to not impact the dependencies (if any) on actual values like Uri etc.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private redactSensitiveDataFromEvent(envelope:any) {
		//Redact sensitive information from suseptible fields
		envelope.data.errorStack = this.getAllSensitiveRedactedFromField(envelope.data.errorStack);
		return envelope;
	}

    //// Get redacted value after all sensitive information is redacted
	getAllSensitiveRedactedFromField(value:string) {
		try {
			// Ensure the  value is of type string
			if (value && typeof value === 'string') {
				this.regexPatternsToRedact.forEach((pattern: RegExp) => {
					value = this.getRedactedValueViaRegexMatch(value, pattern);
				});
			}
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (exception:any) {
			console.warn("Caught exception while processing telemetry data for redaction (if any): " + value);
			console.warn(exception.message);
		}
		return value;
	}

	//// Get redacted value
	getRedactedValueViaRegexMatch(value:string, regexPattern:RegExp) {
		let matches;

		while ((matches = regexPattern.exec(value)) !== null) {
			// This is necessary to avoid infinite loops with zero-width matches
			if (matches.index === regexPattern.lastIndex) {
				regexPattern.lastIndex++;
			}

			matches.forEach((match, groupIndex) => {
				if (groupIndex == 0) { // Redact the entire matched string
					value = value.replace(match, OneDSCollectorEventName.REDACTED); //Replace with string REDACTED
				}
			});
		}
		return value;
	}

    /// Trace exceptions in processing event attributes
	private traceExceptionInEventProcessing() {
		// TODO : Add exception handling
	}

    public flushAndTeardown(): void {
        this.appInsightsCore.flush();
    }
}