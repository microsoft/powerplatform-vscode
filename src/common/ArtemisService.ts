/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import { COPILOT_UNAVAILABLE, SUPPORTED_GEO } from "./copilot/constants";
import { ITelemetry } from "../client/telemetry/ITelemetry";
import { sendTelemetryEvent } from "./copilot/telemetry/copilotTelemetry";
import { CopilotArtemisFailureEvent, CopilotArtemisSuccessEvent } from "./copilot/telemetry/telemetryConstants";

export async function getIntelligenceEndpoint(orgId: string, telemetry: ITelemetry, sessionID: string) {

    const artemisResponse = await fetchArtemisResponse(orgId, telemetry, sessionID);

    if (!artemisResponse) {
        return { intelligenceEndpoint: null, geoName: null };
    }

    const { geoName, environment, clusterNumber } = artemisResponse[0];
    sendTelemetryEvent(telemetry, { eventName: CopilotArtemisSuccessEvent, copilotSessionId: sessionID, geoName: String(geoName), orgId: orgId });

    if (!SUPPORTED_GEO.includes(geoName)) {
        return { intelligenceEndpoint: COPILOT_UNAVAILABLE, geoName: geoName };
    }

    const intelligenceEndpoint = `https://aibuildertextapiservice.${geoName}-${'il' + clusterNumber}.gateway.${environment}.island.powerapps.com/v1.0/${orgId}/appintelligence/chat`

    return { intelligenceEndpoint: intelligenceEndpoint, geoName: geoName };

}

// Function to fetch Artemis response
export async function fetchArtemisResponse(orgId: string, telemetry: ITelemetry, sessionID = '') {
    const { tstUrl, preprodUrl, prodUrl } = convertGuidToUrls(orgId);
    const endpoints = [tstUrl, preprodUrl, prodUrl];

    const artemisResponse = await fetchIslandInfo(endpoints, telemetry, sessionID);

    return artemisResponse;
}

async function fetchIslandInfo(endpoints: string[], telemetry: ITelemetry, sessionID: string) {

    const requestInit: RequestInit = {
        method: 'GET',
        redirect: 'follow'
    };

    try {
        const promises = endpoints.map(async endpoint => {
            try {
                const response = await fetch(endpoint, requestInit);
                if (!response.ok) {
                    throw new Error('Request failed');
                }
                return response.json();
            } catch (error) {
                return null;
            }
        });

        const responses = await Promise.all(promises);
        const successfulResponses = responses.filter(response => response !== null);
        return successfulResponses;
    } catch (error) {
        sendTelemetryEvent(telemetry, { eventName: CopilotArtemisFailureEvent, copilotSessionId: sessionID, error: error as Error })
        return null;
    }
}


/**
 * @param orgId
 * @returns urls
 * ex. orgId: c7809087-d9b8-4a00-a78a-a4b901caa23f
 * TST (note single character zone):  https://c7809087d9b84a00a78aa4b901caa23.f.organization.api.test.powerplatform.com/artemis
 * PreProd (note single character zone):  https://c7809087d9b84a00a78aa4b901caa23.f.organization.api.preprod.powerplatform.com/artemis
 * Prod: https:// c7809087d9b84a00a78aa4b901caa2.3f.organization.api.powerplatform.com/artemis
 */
export function convertGuidToUrls(orgId: string) {
    const updatedOrgId = orgId.replace(/-/g, "");
    const domain = updatedOrgId.slice(0, -1);
    const domainProd = updatedOrgId.slice(0, -2);
    const nonProdSegment = updatedOrgId.slice(-1);
    const prodSegment = updatedOrgId.slice(-2);
    const tstUrl = `https://${domain}.${nonProdSegment}.organization.api.test.powerplatform.com/gateway/cluster?api-version=1`;
    const preprodUrl = `https://${domain}.${nonProdSegment}.organization.api.preprod.powerplatform.com/gateway/cluster?api-version=1`;
    const prodUrl = `https://${domainProd}.${prodSegment}.organization.api.powerplatform.com/gateway/cluster?api-version=1`;

    return {
        tstUrl,
        preprodUrl,
        prodUrl
    };
}
