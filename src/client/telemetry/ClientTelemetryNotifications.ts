// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BaseLanguageClient } from 'vscode-languageclient/node';
import { ITelemetryChannel } from '../../common/telemetry/ITelemetryChannel';
import { TelemetryNotificationPayload } from '../../common/telemetry/Notifications';

export function registerClientToReceiveTelemetryChannelNotifications(client: BaseLanguageClient, telemetryChannel: ITelemetryChannel): void {
    client.onReady()
        .then(() => {
            client.onNotification("telemetry/event", (payloadJson: string) => TelemetryNotificatinoHandler(payloadJson, telemetryChannel));
        });
}

interface TelemetryNotificationPayload_Unknown {
    kind: string;
    serverType: string;
}

function TelemetryNotificatinoHandler(payloadJson: string, telemetryChannel: ITelemetryChannel): void {
    let payload: TelemetryNotificationPayload | undefined;
    try {
        payload = JSON.parse(payloadJson) as TelemetryNotificationPayload;
    } catch (error) {
        // ignore invalid json
        return;
    }

    if (!payload?.kind || !payload.serverType) {
        // ignore payloads missing the required metadata format
        return;
    }

    // Handle the kind of event
    switch (payload.kind) {
        case 'trackEvent':
            payload.event.properties = {
                ...payload.event.properties,
                serverType: payload.serverType
            };
            telemetryChannel.trackEvent(payload.event);
            break;
        case 'trackErrorEvent':
            payload.event.properties = {
                ...payload.event.properties,
                serverType: payload.serverType
            };
            telemetryChannel.trackErrorEvent(payload.event);
            break;

        case 'trackException':
            payload.exceptionData.properties = {
                ...payload.exceptionData.properties,
                serverType: payload.serverType
            };
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
