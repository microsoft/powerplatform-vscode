// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Connection, TelemetryEventNotification} from 'vscode-languageserver/node';
import { ITelemetryEvent, ITelemetryErrorEvent, ITelemetryExceptionData } from '../../common/telemetry/DataInterfaces';
import { ITelemetryChannel } from '../../common/telemetry/ITelemetryChannel';
import { TelemetryNotificationPayload } from '../../common/telemetry/Notifications';

/**
 * An ITelemetryChannel implementation based on an implementation of a vscode-extension-telemetry's TelemetryReporter.
 */
export default class ServerTelemetryChannel implements ITelemetryChannel {
    constructor(
        private readonly connection: Connection,
        private readonly serverType: string
        ){}

    trackEvent(event: ITelemetryEvent): void {
        this._sendTelemetryEventNotification({
            kind: 'trackEvent',
            serverType: this.serverType,
            event,
        });
    }

    trackErrorEvent(event: ITelemetryErrorEvent): void {
        this._sendTelemetryEventNotification({
            kind: 'trackErrorEvent',
            serverType: this.serverType,
            event,
        });
    }

    trackException(exceptionData: ITelemetryExceptionData): void {
        this._sendTelemetryEventNotification({
            kind: 'trackException',
            serverType: this.serverType,
            exceptionData,
        });
    }

    private _sendTelemetryEventNotification(payload: TelemetryNotificationPayload) {
        // Properly typed data will all be JSON-able
        const payloadJson = JSON.stringify(payload);
        this.connection.sendNotification(TelemetryEventNotification.type, payloadJson);
    }
}
