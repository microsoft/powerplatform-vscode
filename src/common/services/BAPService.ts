/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { bapServiceAuthentication, getCommonHeaders } from "./AuthenticationProvider";
import { VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_COMPLETED, VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED } from "./TelemetryConstants";
import { ServiceEndpointCategory, BAP_API_VERSION, BAP_SERVICE_COPILOT_CROSS_GEO_FLAG_RELATIVE_URL, BAP_SERVICE_ENDPOINT } from "./Constants";
import { sendTelemetryEvent } from "../copilot/telemetry/copilotTelemetry";
import { getBAPEndpoint } from "../utilities/Utils";

export class BAPService {
    public static async getCrossGeoCopilotDataMovementEnabledFlag(serviceEndpointStamp: ServiceEndpointCategory, telemetry: ITelemetry, environmentId: string): Promise<boolean> {

        try {
            const accessToken = await bapServiceAuthentication(telemetry, true);

            const response = await fetch(await BAPService.getBAPCopilotCrossGeoFlagEndpoint(serviceEndpointStamp, telemetry, environmentId), {
                method: 'GET',
                headers: getCommonHeaders(accessToken)
            });

            if (response.ok) {
                const data = await response.json();
                sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_COMPLETED, data: data.properties.copilotPolicies?.crossGeoCopilotDataMovementEnabled });
                return data.properties.copilotPolicies?.crossGeoCopilotDataMovementEnabled;
            }

        } catch (error) {
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, errorMsg: (error as Error).message });
        }

        return false;
    }

    static async getBAPCopilotCrossGeoFlagEndpoint(serviceEndpointStamp: ServiceEndpointCategory, telemetry: ITelemetry, environmentId: string): Promise<string> {

        const bapEndpoint = await getBAPEndpoint(serviceEndpointStamp, telemetry);

        return BAP_SERVICE_ENDPOINT.replace('{rootURL}', bapEndpoint) +
            BAP_SERVICE_COPILOT_CROSS_GEO_FLAG_RELATIVE_URL.replace('{environmentID}', environmentId).replace('{apiVersion}', BAP_API_VERSION);
    }

}

