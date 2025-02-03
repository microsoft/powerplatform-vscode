/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { getCommonHeaders, powerPlatformAPIAuthentication } from "./AuthenticationProvider";
import { VSCODE_EXTENSION_SERVICE_STAMP_NOT_FOUND, VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, VSCODE_EXTENSION_GET_PPAPI_WEBSITES_ENDPOINT_UNSUPPORTED_REGION,
VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_ID_COMPLETED, VSCODE_EXTENSION_PPAPI_GET_WEBSITE_DETAILS_FAILED, VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_RECORD_ID_COMPLETED } from "./TelemetryConstants";import { ServiceEndpointCategory, PPAPI_WEBSITES_ENDPOINT, PPAPI_WEBSITES_API_VERSION } from "./Constants";
import { sendTelemetryEvent } from "../copilot/telemetry/copilotTelemetry";
import { IWebsiteDetails } from "./Interfaces";

export class PPAPIService {
    public static async getWebsiteDetailsById(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string, websitePreviewId: string, telemetry: ITelemetry): Promise<IWebsiteDetails | null> { // websitePreviewId aka portalId

        try {
            const accessToken = await powerPlatformAPIAuthentication(telemetry, serviceEndpointStamp, true);
            const response = await fetch(await PPAPIService.getPPAPIServiceEndpoint(serviceEndpointStamp, telemetry, environmentId, websitePreviewId), {
                method: 'GET',
                headers: getCommonHeaders(accessToken)
            });

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

    public static async getWebsiteDetailsByWebsiteRecordId(serviceEndpointStamp: ServiceEndpointCategory | undefined, environmentId: string, websiteRecordId: string, telemetry: ITelemetry): Promise<IWebsiteDetails | null> {

        if (!serviceEndpointStamp) {
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_SERVICE_STAMP_NOT_FOUND, data: serviceEndpointStamp });
            return null;
        }

        const websiteDetailsResponse = await PPAPIService.getWebsiteDetails(serviceEndpointStamp, environmentId, telemetry);
        const websiteDetailsArray = websiteDetailsResponse?.value; // Access all the websites
        const websiteDetails = websiteDetailsArray?.find((website) => website.websiteRecordId === websiteRecordId); // selecting 1st websiteDetails whose websiteRecordId matches


        if (websiteDetails) {
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_RECORD_ID_COMPLETED, orgUrl: websiteDetails.dataverseInstanceUrl });
            return websiteDetails;
        }

        return null;
    }

    static async getWebsiteDetails(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string, telemetry: ITelemetry): Promise<{ value: IWebsiteDetails[] } | null> {
        try {
            const accessToken = await powerPlatformAPIAuthentication(telemetry, serviceEndpointStamp, true);
            const response = await fetch(await PPAPIService.getPPAPIServiceEndpoint(serviceEndpointStamp, telemetry, environmentId), {
                method: 'GET',
                headers: getCommonHeaders(accessToken)
            });

            if (response.ok) {
                const websiteDetailsArray = await response.json() as { value: IWebsiteDetails[] };
                return websiteDetailsArray;
            }
        }
        catch (error) {
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_PPAPI_GET_WEBSITE_DETAILS_FAILED, errorMsg: (error as Error).message });
        }
        return null;
    }

    static async getPPAPIServiceEndpoint(serviceEndpointStamp: ServiceEndpointCategory, telemetry: ITelemetry, environmentId: string, websitePreviewId?: string): Promise<string> {

        let ppApiEndpoint = "";

        switch (serviceEndpointStamp) {
            case ServiceEndpointCategory.TEST:
                ppApiEndpoint = "https://api.test.powerplatform.com";
                break;
            case ServiceEndpointCategory.PREPROD:
                ppApiEndpoint = "https://api.preprod.powerplatform.com";
                break;
            case ServiceEndpointCategory.PROD:
                ppApiEndpoint = "https://api.powerplatform.com";
                break;
            case ServiceEndpointCategory.DOD:
            case ServiceEndpointCategory.GCC:
            case ServiceEndpointCategory.HIGH:
                ppApiEndpoint = "https://api.powerplatform.us";
                break;
            case ServiceEndpointCategory.MOONCAKE:
                ppApiEndpoint = "https://api.powerplatform.cn";
                break;
            default:
                sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_GET_PPAPI_WEBSITES_ENDPOINT_UNSUPPORTED_REGION, data: serviceEndpointStamp });
                break;
        }

        return PPAPI_WEBSITES_ENDPOINT.replace("{rootURL}", ppApiEndpoint)
            .replace("{environmentId}", environmentId) +
            (websitePreviewId ? `/${websitePreviewId}` : '') +
            `?api-version=${PPAPI_WEBSITES_API_VERSION}`;
    }
}
