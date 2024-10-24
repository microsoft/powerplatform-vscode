/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { getCommonHeaders, powerPlatformAPIAuthentication } from "./AuthenticationProvider";
import { VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, VSCODE_EXTENSION_GET_PPAPI_WEBSITES_ENDPOINT_UNSUPPORTED_REGION, VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_ID_COMPLETED } from "./TelemetryConstants";
import { ServiceEndpointCategory, PPAPI_WEBSITES_ENDPOINT, PPAPI_WEBSITES_API_VERSION } from "./Constants";
import { sendTelemetryEvent } from "../copilot/telemetry/copilotTelemetry";
import { IWebsiteDetails } from "./Interfaces";

export class PPAPIService {
    public static async getWebsiteDetailsById(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string, websitePreviewId: string, telemetry: ITelemetry): Promise<IWebsiteDetails | null> { // websitePreviewId aka portalId
        try {
            const accessToken = await powerPlatformAPIAuthentication(telemetry, true);
            const response = await fetch(await PPAPIService.getPPAPIServiceEndpoint(serviceEndpointStamp, telemetry, environmentId, websitePreviewId), {
                method: 'GET',
                headers: getCommonHeaders(accessToken)
            });
            await this.getWebsiteDetails(serviceEndpointStamp, environmentId, telemetry);
            if (response.ok) {
                const websiteDetails = await response.json() as unknown as IWebsiteDetails;
                sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_ID_COMPLETED, orgUrl: websiteDetails.dataverseInstanceUrl });
                return websiteDetails;
            }
        }
        catch (error) {
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, errorMsg: (error as Error).message });
        }

        return null;
    }

    public static async getWebsiteDetailsByWebsiteRecordId(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string, websiteRecordId: string, telemetry: ITelemetry): Promise<IWebsiteDetails | null> {

        const websiteDetailsArray = await PPAPIService.getWebsiteDetails(serviceEndpointStamp, environmentId, telemetry);
        const websiteDetails = websiteDetailsArray?.find((website) => website.websiteRecordId === websiteRecordId);

        if (websiteDetails) {
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_ID_COMPLETED, orgUrl: websiteDetails.dataverseInstanceUrl });
            return websiteDetails;
        }
        return null;
    }

    static async getWebsiteDetails(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string, telemetry: ITelemetry): Promise<IWebsiteDetails[] | null> {
        try {
            const accessToken = await powerPlatformAPIAuthentication(telemetry, true);
            const response = await fetch(await PPAPIService.getPPAPIServiceEndpoint(serviceEndpointStamp, telemetry, environmentId), {
                method: 'GET',
                headers: getCommonHeaders(accessToken)
            });

            if (response.ok) {
                const websiteDetailsArray = await response.json() as unknown as IWebsiteDetails[];
                return websiteDetailsArray;
            }
        }
        catch (error) {
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, errorMsg: (error as Error).message });
        }
        return null;
    }



    static async getPPAPIServiceEndpoint(serviceEndpointStamp: ServiceEndpointCategory, telemetry: ITelemetry, environmentId: string, websitePreviewId?: string): Promise<string> {

        let ppapiEndpoint = "";

        switch (serviceEndpointStamp) {
            case ServiceEndpointCategory.TEST:
                ppapiEndpoint = "https://api.test.powerplatform.com";
                break;
            case ServiceEndpointCategory.PREPROD:
                ppapiEndpoint = "https://api.preprod.powerplatform.com";
                break;
            case ServiceEndpointCategory.PROD:
                ppapiEndpoint = "https://api.powerplatform.com";
                break;
            // All below endpoints are not supported yet
            case ServiceEndpointCategory.DOD:
            case ServiceEndpointCategory.GCC:
            case ServiceEndpointCategory.HIGH:
            case ServiceEndpointCategory.MOONCAKE:
            default:
                sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_GET_PPAPI_WEBSITES_ENDPOINT_UNSUPPORTED_REGION, data: serviceEndpointStamp });
                break;
        }

        return PPAPI_WEBSITES_ENDPOINT.replace("{rootURL}", ppapiEndpoint)
            .replace("{environmentId}", environmentId) +
            (websitePreviewId ? `/${websitePreviewId}` : '') +
            `?api-version=${PPAPI_WEBSITES_API_VERSION}`;
    }
}
