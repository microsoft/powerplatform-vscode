/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Connection, TelemetryEventNotification} from 'vscode-languageserver/node';

export function sendTelemetryEvent(connection: Connection, payload: string) {
    connection.sendNotification(TelemetryEventNotification.type, payload);
}
