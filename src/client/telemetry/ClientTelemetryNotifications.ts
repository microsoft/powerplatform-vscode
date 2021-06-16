// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BaseLanguageClient } from 'vscode-languageclient/node';
import { ITelemetryChannel } from '../../common/telemetry/ITelemetryChannel';
import { TelemetryNotificationPayload } from '../../common/telemetry/Notifications';

export function registerClientToReceiveTelemetryChannelNotifications(client: BaseLanguageClient, telemetryChannel: ITelemetryChannel): void {
    client.onReady()
        .then(() => {
            client.onNotification("telemetry/event", (payload: TelemetryNotificationPayload) => TelemetryNotificatinoHandler(payload, telemetryChannel));
        });
}

interface TelemetryNotificationPayload_Unknown {
    kind: string;
    serverType: string;
}

function TelemetryNotificatinoHandler(payload: TelemetryNotificationPayload, telemetryChannel: ITelemetryChannel): void {
    if (!payload || !payload.kind || !payload.serverType) {
        // ignore payloads missing the required metadata format
        return;
    }

    // Handle the kind of event
    switch (payload.kind) {
        case 'trackEvent':
            telemetryChannel.trackEvent(payload.event);
            break;
        case 'trackErrorEvent':
            telemetryChannel.trackErrorEvent(payload.event);
            break;

        case 'trackException':
            telemetryChannel.trackException(payload.exceptionData);
            break;

        default:
            {
                const unknownPayload = <TelemetryNotificationPayload_Unknown>payload;
                telemetryChannel.trackErrorEvent({
                    name: 'InvalidNotificationPayload',
                    properties: { message: `'kind' with value '${unknownPayload.kind}' is not implemented. serverType: '${unknownPayload.serverType}'` }
                });
                break;
            }
    }
}
