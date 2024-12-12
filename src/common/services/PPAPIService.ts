/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { getCommonHeaders, powerPlatformAPIAuthentication } from "./AuthenticationProvider";
import { VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, VSCODE_EXTENSION_GET_PPAPI_WEBSITES_ENDPOINT_UNSUPPORTED_REGION, VSCODE_EXTENSION_PPAPI_CREATE_WEBSITE_COMPLETED, VSCODE_EXTENSION_PPAPI_CREATE_WEBSITE_FAILED, VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_ID_COMPLETED, VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_RECORD_ID_COMPLETED, VSCODE_EXTENSION_PPAPI_GET_WEBSITE_DETAILS_FAILED, VSCODE_EXTENSION_SERVICE_STAMP_NOT_FOUND } from "./TelemetryConstants";
import { ServiceEndpointCategory, PPAPI_WEBSITES_ENDPOINT, PPAPI_WEBSITES_API_VERSION, DEFAULT_PORTAL_TEMPLATE } from "./Constants";
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
                const websiteDetails = await response.json() as IWebsiteDetails;
                sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_ID_COMPLETED, orgUrl: websiteDetails.dataverseInstanceUrl });
                return websiteDetails;
            }
        }
        catch (error) {
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, errorMsg: (error as Error).message });
        }

        return null;
    }

    public static async createWebsite(serviceEndpointStamp: ServiceEndpointCategory,
        environmentId: string,
        orgId: string,
        websiteName: string,
        websiteLanguage: number,
        websiteId: string,
        telemetry: ITelemetry) { // websitePreviewId aka portalId

        const ppapiEndpoint = await PPAPIService.getPPAPIServiceEndpoint(serviceEndpointStamp, telemetry, environmentId);
        console.log(ppapiEndpoint);

        try {
            const accessToken = await powerPlatformAPIAuthentication(telemetry, serviceEndpointStamp, true);
            const siteSuffix = websiteId;
            websiteName = websiteName.replace(/\s+/g, '-');
            const response = await fetch(ppapiEndpoint, {
                method: 'POST',
                headers: getCommonHeaders(accessToken),
                body: JSON.stringify({
                    dataverseOrganizationId: orgId,
                    name: websiteName, // Add name sanitization function
                    selectedBaseLanguage: websiteLanguage,
                    subDomain: `${websiteName}-${siteSuffix.slice(-6)}`, // Remove spaces from websiteName
                    templateName: DEFAULT_PORTAL_TEMPLATE,
                    websiteRecordId: siteSuffix // If this ID is passed package installation is not done and portal is associated with the passed ID - we should use this option
                })
            });

            if (response.ok) {
                sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_PPAPI_CREATE_WEBSITE_COMPLETED, data: `environmentId: ${environmentId}, orgId: ${orgId}, websiteName: ${websiteName}` });
            }
            else {
                sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_PPAPI_CREATE_WEBSITE_FAILED, errorMsg: `Failed to create website. Response status: ${response.status}, Response text: ${response.statusText}` });
            }
        }
        catch (error) {
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_PPAPI_CREATE_WEBSITE_FAILED, errorMsg: (error as Error).message });
        }

        return null;
    }

    static async getPPAPIServiceEndpoint(serviceEndpointStamp: ServiceEndpointCategory, telemetry: ITelemetry, environmentId: string, websitePreviewId?: string): Promise<string> {

        let ppapiEndpoint = "";

        switch (serviceEndpointStamp) {
            case ServiceEndpointCategory.TEST:
                ppapiEndpoint = "https://api.test.powerplatform.com";
                return "";
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

        return `${PPAPI_WEBSITES_ENDPOINT.replace("{rootURL}", ppapiEndpoint).replace("{environmentId}", environmentId)}${websitePreviewId ? `/${websitePreviewId}` : ''}?api-version=${PPAPI_WEBSITES_API_VERSION}`;
    }

    public static async getWebsiteDetailsByWebsiteRecordId(serviceEndpointStamp: ServiceEndpointCategory | undefined, environmentId: string, websiteRecordId: string, telemetry: ITelemetry): Promise<IWebsiteDetails | null> {

        if (!serviceEndpointStamp) {
            sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_SERVICE_STAMP_NOT_FOUND, data: serviceEndpointStamp });
            return null;
        }

        const websiteDetailsResponse = await PPAPIService.getWebsiteDetails(serviceEndpointStamp, environmentId, telemetry);
        if (!websiteDetailsResponse) {
            return null;
        }
        const websiteDetailsArray = websiteDetailsResponse.value;
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
}
