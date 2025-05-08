/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { getCommonHeaders, powerPlatformAPIAuthentication } from "./AuthenticationProvider";
import {
    VSCODE_EXTENSION_SERVICE_STAMP_NOT_FOUND, VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, VSCODE_EXTENSION_GET_PPAPI_WEBSITES_ENDPOINT_UNSUPPORTED_REGION,
    VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_ID_COMPLETED, VSCODE_EXTENSION_PPAPI_GET_WEBSITE_DETAILS_FAILED, VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_RECORD_ID_COMPLETED, VSCODE_EXTENSION_GOVERNANCE_CHECK_SUCCESS, VSCODE_EXTENSION_GOVERNANCE_CHECK_FAILED
} from "./TelemetryConstants";
import { ServiceEndpointCategory, PPAPI_WEBSITES_ENDPOINT, PPAPI_WEBSITES_API_VERSION} from "./Constants";
import { sendTelemetryEvent } from "../copilot/telemetry/copilotTelemetry";
import { IWebsiteDetails } from "./Interfaces";

export class PPAPIService {
    public static async getWebsiteDetailsById(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string, websitePreviewId: string): Promise<IWebsiteDetails | null> { // websitePreviewId aka portalId

        try {
            const accessToken = await powerPlatformAPIAuthentication(serviceEndpointStamp, true);
            const response = await fetch(await PPAPIService.getPPAPIServiceEndpoint(serviceEndpointStamp, environmentId, websitePreviewId), {
                method: 'GET',
                headers: getCommonHeaders(accessToken)
            });

            if (response.ok) {
                const websiteDetails = await response.json() as unknown as IWebsiteDetails;
                sendTelemetryEvent({ eventName: VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_ID_COMPLETED, orgUrl: websiteDetails.dataverseInstanceUrl });
                return websiteDetails;
            }
        }
        catch (error) {
            sendTelemetryEvent({ eventName: VSCODE_EXTENSION_GET_CROSS_GEO_DATA_MOVEMENT_ENABLED_FLAG_FAILED, errorMsg: (error as Error).message });
        }

        return null;
    }

    public static async getWebsiteDetailsByWebsiteRecordId(serviceEndpointStamp: ServiceEndpointCategory | undefined, environmentId: string, websiteRecordId: string): Promise<IWebsiteDetails | null> {

        if (!serviceEndpointStamp) {
            sendTelemetryEvent({ eventName: VSCODE_EXTENSION_SERVICE_STAMP_NOT_FOUND, data: serviceEndpointStamp });
            return null;
        }

        const websiteDetailsResponse = await PPAPIService.getAllWebsiteDetails(serviceEndpointStamp, environmentId);
        const websiteDetails = websiteDetailsResponse?.find((website) => website.websiteRecordId === websiteRecordId); // selecting 1st websiteDetails whose websiteRecordId matches


        if (websiteDetails) {
            sendTelemetryEvent({ eventName: VSCODE_EXTENSION_PPAPI_GET_WEBSITE_BY_RECORD_ID_COMPLETED, orgUrl: websiteDetails.dataverseInstanceUrl });
            return websiteDetails;
        }

        return null;
    }

    static async getAllWebsiteDetails(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string): Promise<IWebsiteDetails[]> {
        try {
            const accessToken = await powerPlatformAPIAuthentication(serviceEndpointStamp, true);
            const response = await fetch(await PPAPIService.getPPAPIServiceEndpoint(serviceEndpointStamp, environmentId), {
                method: 'GET',
                headers: getCommonHeaders(accessToken)
            });

            if (response.ok) {
                const parsedResponse = await response.json();
                const websiteDetailsArray = parsedResponse.value as IWebsiteDetails[];
                return websiteDetailsArray;
            }
            throw new Error(`Failed to fetch website details. Status: ${response.status}`);
        }
        catch (error) {
            // Question: Is it okay to use the copilot telemetry here in this file?
            sendTelemetryEvent({ eventName: VSCODE_EXTENSION_PPAPI_GET_WEBSITE_DETAILS_FAILED, errorMsg: (error as Error).message });
        }
        return [];
    }

    static async getPPAPIServiceEndpoint(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string, websitePreviewId?: string): Promise<string> {

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
                sendTelemetryEvent({ eventName: VSCODE_EXTENSION_GET_PPAPI_WEBSITES_ENDPOINT_UNSUPPORTED_REGION, data: serviceEndpointStamp });
                break;
        }

        return PPAPI_WEBSITES_ENDPOINT.replace("{rootURL}", ppApiEndpoint)
            .replace("{environmentId}", environmentId) +
            (websitePreviewId ? `/${websitePreviewId}` : '') +
            `?api-version=${PPAPI_WEBSITES_API_VERSION}`;
    }

    static async getGovernanceFlag(
        serviceEndpointStamp: ServiceEndpointCategory,
        environmentId: string,
        sessionId: string,
        copilotGovernanceSetting: string,
        websiteId: string | null
    ): Promise<boolean> {
        try {
            let governanceEndpoint: string;
            const accessToken = await powerPlatformAPIAuthentication(serviceEndpointStamp, true);
            const ppBaseEndpoint = await PPAPIService.getPPAPIServiceEndpoint(serviceEndpointStamp, environmentId);

            // Build governance endpoint URL based on whether website ID is provided
            if (websiteId) {
                // When site context is present.
                const websiteDetails = await this.getWebsiteDetailsByWebsiteRecordId(serviceEndpointStamp, environmentId, websiteId);
                governanceEndpoint = `${ppBaseEndpoint.split('?')[0]}/${websiteDetails?.id}/governance/${copilotGovernanceSetting}?api-version=${PPAPI_WEBSITES_API_VERSION}`;
            } else {
                // Using copilot without site context.
                const envEndpoint = ppBaseEndpoint.split('/websites')[0];
                governanceEndpoint = `${envEndpoint}/governance/${copilotGovernanceSetting}?api-version=${PPAPI_WEBSITES_API_VERSION}`;
            }

            const response = await fetch(governanceEndpoint, {
                method: 'GET',
                headers: getCommonHeaders(accessToken)
            });

            if (response.ok) {
                const result = await response.json();
                const allowProDevCopilots = ["all", "include", "exclude", "true"].includes(result.toString().toLowerCase());

                sendTelemetryEvent({
                    eventName: VSCODE_EXTENSION_GOVERNANCE_CHECK_SUCCESS,
                    environmentId: environmentId,
                    websiteId: websiteId || '',
                    copilotSessionId: sessionId,
                    copilotGovernanceResponse: result.toString(),
                });

                return allowProDevCopilots;
            }

            sendTelemetryEvent({
                eventName: VSCODE_EXTENSION_GOVERNANCE_CHECK_FAILED,
                environmentId: environmentId,
                websiteId: websiteId || '',
                copilotSessionId: sessionId,
                errorMsg: `HTTP Error: ${response.status}`
            });

            return false;
        } catch (error) {
            sendTelemetryEvent({
                eventName: VSCODE_EXTENSION_GOVERNANCE_CHECK_FAILED,
                environmentId: environmentId,
                websiteId: websiteId || '',
                copilotSessionId: sessionId,
                errorMsg: (error as Error).message
            });

            return false;
        }
    }
}
