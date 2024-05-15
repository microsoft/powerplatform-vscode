/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../client/telemetry/ITelemetry";
import { bapServiceAuthentication, getCommonHeaders } from "./AuthenticationProvider";
import { VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_COMPLETED, VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED } from "./TelemetryConstants";
import { BAPServiceStamp, BAP_API_VERSION, BAP_SERVICE_COPILOT_CROSS_GEO_FLAG_RELATIVE_URL, BAP_SERVICE_ENDPOINT } from "./constants";
import { sendTelemetryEvent } from "./copilot/telemetry/copilotTelemetry";

export async function getCrossGeoCopilotDataMovementEnabledFlag(serviceEndpointStamp: BAPServiceStamp, telemetry: ITelemetry, environmentId: string): Promise<boolean> {

    try {
        const accessToken = await bapServiceAuthentication(telemetry, true);

        const response = await fetch(await getBAPEndpoint(serviceEndpointStamp, environmentId), {
            method: 'GET',
            headers: getCommonHeaders(accessToken)
        });

        if (response.ok) {
            const data = await response.json();
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_COMPLETED, data: data.enabled });
            return data.enabled;
        }

    } catch (error) {
        sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, errorMsg: (error as Error).message });
    }

    return false;
}

export async function getBAPEndpoint(serviceEndpointStamp: BAPServiceStamp, environmentId: string): Promise<string> {

    let bapEndpoint = "";

    switch (serviceEndpointStamp) {
        case BAPServiceStamp.TEST:
            bapEndpoint = "https://test.api.bap.microsoft.com";
            break;
        case BAPServiceStamp.PREPROD:
            bapEndpoint = "https://preprod.api.bap.microsoft.com";
            break;
        case BAPServiceStamp.PROD:
            bapEndpoint = "https://api.bap.microsoft.com";
            break;
    }

    return BAP_SERVICE_ENDPOINT.replace('{rootURL}', bapEndpoint) +
        BAP_SERVICE_COPILOT_CROSS_GEO_FLAG_RELATIVE_URL.replace('{environmentID}', environmentId).replace('{apiVersion}', BAP_API_VERSION);
}

