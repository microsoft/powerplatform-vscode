/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { bapServiceAuthentication, getCommonHeaders } from "./AuthenticationProvider";
import { VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_COMPLETED, VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED } from "./TelemetryConstants";
import { ServiceEndpointCategory, BAP_API_VERSION, BAP_SERVICE_COPILOT_CROSS_GEO_FLAG_RELATIVE_URL, BAP_SERVICE_ENDPOINT } from "./Constants";
import { sendTelemetryEvent } from "../copilot/telemetry/copilotTelemetry";
import { getBAPEndpoint } from "../utilities/Utils";

export class BAPService {
    public static async getCrossGeoCopilotDataMovementEnabledFlag(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string): Promise<boolean> {

        try {
            const accessToken = await bapServiceAuthentication(true);

            const response = await fetch(await BAPService.getBAPCopilotCrossGeoFlagEndpoint(serviceEndpointStamp, environmentId), {
                method: 'GET',
                headers: getCommonHeaders(accessToken)
            });

            if (response.ok) {
                const data = await response.json();
                sendTelemetryEvent({ eventName: VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_COMPLETED, data: data.properties.copilotPolicies?.crossGeoCopilotDataMovementEnabled });
                return data.properties.copilotPolicies?.crossGeoCopilotDataMovementEnabled;
            }

        } catch (error) {
            sendTelemetryEvent({ eventName: VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, errorMsg: (error as Error).message });
        }

        return false;
    }

    static async getBAPCopilotCrossGeoFlagEndpoint(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string): Promise<string> {

        const bapEndpoint = await getBAPEndpoint(serviceEndpointStamp);

        return BAP_SERVICE_ENDPOINT.replace('{rootURL}', bapEndpoint) +
            BAP_SERVICE_COPILOT_CROSS_GEO_FLAG_RELATIVE_URL.replace('{environmentID}', environmentId).replace('{apiVersion}', BAP_API_VERSION);
    }

}

