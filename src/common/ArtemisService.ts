/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, {RequestInit} from "node-fetch";
import { COPILOT_DISABLED, US_GEO } from "./copilot/constants";
import { ITelemetry } from "../client/telemetry/ITelemetry";
import { sendTelemetryEvent } from "./copilot/telemetry/copilotTelemetry";
import { CopilotArtemisFailureEvent, CopilotArtemisSuccessEvent } from "./copilot/telemetry/telemetryConstants";

export async function getIntelligenceEndpoint (orgId: string, telemetry:ITelemetry, sessionID:string) {
    const { tstUrl, preprodUrl, prodUrl } = convertGuidToUrls(orgId);
    const endpoints = [tstUrl, preprodUrl, prodUrl];

    const artemisResponse = await fetchDataParallel(endpoints, telemetry, sessionID);
    
    if (!artemisResponse) {
        return null;
    }
    sendTelemetryEvent(telemetry, {eventName: CopilotArtemisSuccessEvent, copilotSessionId: sessionID})
    const { clusterNumber, geoName, environment } = artemisResponse[0];

    if(geoName !== US_GEO) {
        return COPILOT_DISABLED;
    }

    const intelligenceEndpoint = `https://aibuildertextapiservice.${geoName}-il${clusterNumber}.gateway.${environment}.island.powerapps.com/v1.0/${orgId}/appintelligence/chat`

    return intelligenceEndpoint;
    
}

async function fetchDataParallel(endpoints: string[], telemetry: ITelemetry, sessionID: string) {

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      sendTelemetryEvent(telemetry, {eventName: CopilotArtemisFailureEvent, copilotSessionId: sessionID, error: error})
      return null;
    }
  }
  

export function convertGuidToUrls(orgId: string) {
    const updatedOrgId = orgId.replace(/-/g, "");
    const domain = updatedOrgId.replace(/-/g, "").slice(0, -1);
    const domainProd = updatedOrgId.replace(/-/g, "").slice(0, -2);
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
