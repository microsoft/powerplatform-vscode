/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Connection, TelemetryEventNotification} from 'vscode-languageserver/node';
import { ITelemetryData } from '../../common/TelemetryData';

export function sendTelemetryEvent(connection: Connection, telemetryData: ITelemetryData): void {
    const payload = JSON.stringify(telemetryData);
    connection.sendNotification(TelemetryEventNotification.type, payload);
}
