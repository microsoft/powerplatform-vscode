// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { v4 } from 'uuid';
import { Connection, TelemetryEventNotification } from 'vscode-languageserver/node';
import { ITelemetryEvent, ITelemetryErrorEvent, ITelemetryExceptionData } from '../../common/telemetry/DataInterfaces';
import { ITelemetryChannel } from '../../common/telemetry/ITelemetryChannel';
import { TelemetryNotificationPayload } from '../../common/telemetry/Notifications';

/**
 * An ITelemetryChannel implementation based on an implementation of a vscode-extension-telemetry's TelemetryReporter.
 */
export default class ServerTelemetryChannel implements ITelemetryChannel {
    constructor(
        private readonly connection: Connection,
        private readonly serverType: string,
        private readonly serverInstanceId: string = v4() // ensures a unique id is set for each server instace, in case some servers get loaded more than once
    ) { }

    trackEvent(event: ITelemetryEvent): void {
        event.properties = this._concatServerProperties(event.properties);
        this._sendTelemetryEventNotification({
            kind: 'trackEvent',
            serverType: this.serverType,
            event,
        });
    }

    trackErrorEvent(event: ITelemetryErrorEvent): void {
        event.properties = this._concatServerProperties(event.properties);
        this._sendTelemetryEventNotification({
            kind: 'trackErrorEvent',
            serverType: this.serverType,
            event,
        });
    }

    trackException(exceptionData: ITelemetryExceptionData): void {
        exceptionData.properties = this._concatServerProperties(exceptionData.properties);
        this._sendTelemetryEventNotification({
            kind: 'trackException',
            serverType: this.serverType,
            exceptionData,
        });
    }

    private _concatServerProperties(properties?: Record<string, string>): Record<string, string> {
        return {
            ...properties,
            serverType: this.serverType,
            serverInstanceId: this.serverInstanceId
        };
    }

    private _sendTelemetryEventNotification(payload: TelemetryNotificationPayload) {
        // Note: We don't need to stringify the payload into JSON, as the notification channel does this already.
        this.connection.sendNotification(TelemetryEventNotification.type, payload);
    }
}
