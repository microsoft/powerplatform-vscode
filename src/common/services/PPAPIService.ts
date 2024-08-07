/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { getCommonHeaders, powerPlatformAPIAuthentication } from "./AuthenticationProvider";
import { VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, VSCODE_EXTENSION_GET_PPAPI_WEBSITES_ENDPOINT_UNSUPPORTED_REGION, VSCODE_EXTENSION_PPAPI_CREATE_WEBSITE_COMPLETED, VSCODE_EXTENSION_PPAPI_CREATE_WEBSITE_FAILED, VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_ID_COMPLETED } from "./TelemetryConstants";
import { ServiceEndpointCategory, PPAPI_WEBSITES_ENDPOINT, PPAPI_WEBSITES_API_VERSION } from "./Constants";
import { sendTelemetryEvent } from "../copilot/telemetry/copilotTelemetry";
import { IWebsiteDetails } from "./Interfaces";
import { v4 as uuidv4 } from 'uuid'

export class PPAPIService {
    public static async getWebsiteDetailsById(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string, websitePreviewId: string, telemetry: ITelemetry): Promise<IWebsiteDetails | null> { // websitePreviewId aka portalId

        try {
            const accessToken = await powerPlatformAPIAuthentication(telemetry, true);
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

    public static async createWebsite(serviceEndpointStamp: ServiceEndpointCategory,
        environmentId: string,
        orgId: string,
        websiteName: string,
        websiteLanguage: number,
        telemetry: ITelemetry) { // websitePreviewId aka portalId

        try {
            console.log("Creating website");
            const accessToken = await powerPlatformAPIAuthentication(telemetry, true);
            const siteSuffix = uuidv4();
            const response = await fetch(await PPAPIService.getPPAPIServiceEndpoint(serviceEndpointStamp, telemetry, environmentId), {
                method: 'POST',
                headers: getCommonHeaders(accessToken),
                body: JSON.stringify({
                    dataverseOrganizationId: orgId,
                    name: websiteName, // Add name sanitization function
                    selectedBaseLanguage: websiteLanguage,
                    subDomain: websiteName + `-${siteSuffix.slice(siteSuffix.length - 6, siteSuffix.length)}`, // Add name sanitization function
                    templateName: "DefaultPortalTemplate",
                    websiteRecordId: siteSuffix // If this ID is passed package installation is not done and portal is associated with the passed ID - we should use this option
                })
            });

            console.log(response);

            if (response.ok) {
                sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_PPAPI_CREATE_WEBSITE_COMPLETED, data: `environmentId:${environmentId}, orgId:${orgId}, websiteName:${websiteName}` });
            }
            else {
                sendTelemetryEvent(telemetry, { eventName: VSCODE_EXTENSION_PPAPI_CREATE_WEBSITE_FAILED, errorMsg: `Failed to create website. Response status: ${response.status}` });
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
