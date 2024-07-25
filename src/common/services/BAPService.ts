/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { bapServiceAuthentication, getCommonHeaders } from "./AuthenticationProvider";
import { VSCODE_EXTENSION_GET_BAP_ENDPOINT_UNSUPPORTED_REGION, VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_COMPLETED, VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED } from "./TelemetryConstants";
import { ServiceEndpointCategory, BAP_API_VERSION, BAP_SERVICE_COPILOT_CROSS_GEO_FLAG_RELATIVE_URL, BAP_SERVICE_ENDPOINT } from "./Constants";
import { sendTelemetryEvent } from "../copilot/telemetry/copilotTelemetry";

export class BAPService {
    public static async getCrossGeoCopilotDataMovementEnabledFlag(serviceEndpointStamp: ServiceEndpointCategory, telemetry: ITelemetry, environmentId: string): Promise<boolean> {

        try {
            const accessToken = await bapServiceAuthentication(telemetry, true);

            const response = await fetch(await BAPService.getBAPEndpoint(serviceEndpointStamp, telemetry, environmentId), {
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

    static async getBAPEndpoint(serviceEndpointStamp: ServiceEndpointCategory, telemetry: ITelemetry, environmentId: string): Promise<string> {

        let bapEndpoint = "";

        switch (serviceEndpointStamp) {
            case ServiceEndpointCategory.TEST:
                bapEndpoint = "https://test.api.bap.microsoft.com";
                break;
            case ServiceEndpointCategory.PREPROD:
                bapEndpoint = "https://preprod.api.bap.microsoft.com";
                break;
            case ServiceEndpointCategory.PROD:
                bapEndpoint = "https://api.bap.microsoft.com";
                break;
            // All below endpoints are not supported yet
            case ServiceEndpointCategory.DOD:
            case ServiceEndpointCategory.GCC:
            case ServiceEndpointCategory.HIGH:
            case ServiceEndpointCategory.MOONCAKE:
            default:
                sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_GET_BAP_ENDPOINT_UNSUPPORTED_REGION, data: serviceEndpointStamp });
                break;
        }

        return BAP_SERVICE_ENDPOINT.replace('{rootURL}', bapEndpoint) +
            BAP_SERVICE_COPILOT_CROSS_GEO_FLAG_RELATIVE_URL.replace('{environmentID}', environmentId).replace('{apiVersion}', BAP_API_VERSION);
    }

}

