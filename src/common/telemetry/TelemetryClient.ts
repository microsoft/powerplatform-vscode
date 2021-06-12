// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IStartCommandEvent, ITelemetryErrorEvent, ITelemetryEvent, ITelemetryExceptionData } from "./DataInterfaces";
import { ITelemetryChannel } from "./ITelemetryChannel";

/**
 * A telemetry client service that can be used anywhere in the extension code as long as an appropriate ITelemetryChannel is provided at construction.
 */
export default class TelemetryClient {
    constructor(private readonly _channel: ITelemetryChannel) {
    }

    // TODO: Add overload taking string
    trackEvent(event: ITelemetryEvent): void;
    trackEvent<TEvent extends ITelemetryEvent>(event: TEvent): void;
    trackEvent(name: string, properties?: Record<string, string>, measurements?: Record<string, number>): void;
    trackEvent(eventOrName: ITelemetryEvent | string, properties?: Record<string, string>, measurements?: Record<string, number>): void {
        let event: ITelemetryEvent;
        if(typeof eventOrName === 'string') {
            event = {name: eventOrName};
            if(properties) {
                event.properties = properties;
            }
            if(measurements) {
                event.measurements = measurements;
            }
        } else {
            event = eventOrName;
        }

        this._channel.trackEvent(event);
    }

    trackErrorEvent(event: ITelemetryErrorEvent): void {
        this._channel.trackErrorEvent(event);
    }

    trackException(errorData: ITelemetryExceptionData): void {
        this._channel.trackException(errorData);
    }

    trackStartCommandEvent(commandId: string, properties?: Record<string, string>): void {
        this.trackEvent<IStartCommandEvent>({
            name: 'StartCommand',
            properties: { ...properties, commandId },
        });
    }
}
