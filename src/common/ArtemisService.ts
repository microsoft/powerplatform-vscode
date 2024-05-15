/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import { COPILOT_UNAVAILABLE, SUPPORTED_GEO } from "./copilot/constants";
import { ITelemetry } from "../client/telemetry/ITelemetry";
import { sendTelemetryEvent } from "./copilot/telemetry/copilotTelemetry";
import { CopilotArtemisFailureEvent, CopilotArtemisSuccessEvent } from "./copilot/telemetry/telemetryConstants";
import { getCrossGeoCopilotDataMovementEnabledFlag } from "./BAPService";
import { BAPServiceStamp as BAPAPIEndpointStamp } from "./constants";
import { IArtemisAPIOrgResponse, IArtemisServiceEndpointInformation } from "./Interfaces";

export async function getIntelligenceEndpoint(orgId: string, telemetry: ITelemetry, sessionID: string, environmentId: string) {

    const artemisResponses = await fetchArtemisResponse(orgId, telemetry, sessionID);

    if (artemisResponses === null || artemisResponses.length === 0) {
        return { intelligenceEndpoint: null, geoName: null };
    }

    const artemisResponse = artemisResponses[0];

    if (artemisResponse !== null) {
        const { geoName, environment, clusterNumber } = artemisResponse.response as unknown as IArtemisAPIOrgResponse;
        sendTelemetryEvent(telemetry, { eventName: CopilotArtemisSuccessEvent, copilotSessionId: sessionID, geoName: String(geoName), orgId: orgId });

        const response = await getCrossGeoCopilotDataMovementEnabledFlag(artemisResponse.stamp, telemetry, environmentId);

        console.log("PPAC flag: ", artemisResponse, response);

        if (!SUPPORTED_GEO.includes(geoName)) {
            return { intelligenceEndpoint: COPILOT_UNAVAILABLE, geoName: geoName };
        }

        const intelligenceEndpoint = `https://aibuildertextapiservice.${geoName}-${'il' + clusterNumber}.gateway.${environment}.island.powerapps.com/v1.0/${orgId}/appintelligence/chat`

        return { intelligenceEndpoint: intelligenceEndpoint, geoName: geoName };
    }

    return { intelligenceEndpoint: null, geoName: null };
}

// Function to fetch Artemis response
export async function fetchArtemisResponse(orgId: string, telemetry: ITelemetry, sessionID = '') {
    const endpointDetails = convertGuidToUrls(orgId);

    const artemisResponse = await fetchIslandInfo(endpointDetails, telemetry, sessionID);

    return artemisResponse;
}

async function fetchIslandInfo(endpointDetails: IArtemisServiceEndpointInformation[], telemetry: ITelemetry, sessionID: string) {

    const requestInit: RequestInit = {
        method: 'GET',
        redirect: 'follow'
    };

    try {
        const promises = endpointDetails.map(async endpointDetail => {
            try {
                const response = await fetch(endpointDetail.endpoint, requestInit);
                if (!response.ok) {
                    throw new Error('Request failed');
                }
                return { stamp: endpointDetail.stamp, response: response.json() };
            } catch (error) {
                return null;
            }
        });

        const results = await Promise.all(promises);
        const successfulResponses = results.filter(result => result?.response !== null);
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
export function convertGuidToUrls(orgId: string): IArtemisServiceEndpointInformation[] {
    const updatedOrgId = orgId.replace(/-/g, "");
    const domain = updatedOrgId.slice(0, -1);
    const domainProd = updatedOrgId.slice(0, -2);
    const nonProdSegment = updatedOrgId.slice(-1);
    const prodSegment = updatedOrgId.slice(-2);
    const tstUrl = `https://${domain}.${nonProdSegment}.organization.api.test.powerplatform.com/gateway/cluster?api-version=1`;
    const preprodUrl = `https://${domain}.${nonProdSegment}.organization.api.preprod.powerplatform.com/gateway/cluster?api-version=1`;
    const prodUrl = `https://${domainProd}.${prodSegment}.organization.api.powerplatform.com/gateway/cluster?api-version=1`;
    const gccUrl = `https://${domain}.${nonProdSegment}.organization.api.gov.powerplatform.microsoft.us/gateway/cluster?api-version=1`;
    const highUrl = `https://${domain}.${nonProdSegment}.organization.api.high.powerplatform.microsoft.us/gateway/cluster?api-version=1`;
    const mooncakeUrl = `https://${domain}.${nonProdSegment}.organization.api.powerplatform.partner.microsoftonline.cn/gateway/cluster?app-version=1`;
    const dodUrl = `https://${domain}.${nonProdSegment}.organization.api.appsplatform.us/gateway/cluster?app-version=1`;

    return [
        { stamp: BAPAPIEndpointStamp.TEST, endpoint: tstUrl },
        { stamp: BAPAPIEndpointStamp.PREPROD, endpoint: preprodUrl },
        { stamp: BAPAPIEndpointStamp.PROD, endpoint: prodUrl },
        { stamp: BAPAPIEndpointStamp.GCC, endpoint: gccUrl },
        { stamp: BAPAPIEndpointStamp.HIGH, endpoint: highUrl },
        { stamp: BAPAPIEndpointStamp.MOONCAKE, endpoint: mooncakeUrl },
        { stamp: BAPAPIEndpointStamp.DOD, endpoint: dodUrl },
    ];
}
