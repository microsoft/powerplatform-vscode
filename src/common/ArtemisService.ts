/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, {RequestInit} from "node-fetch";
import { COPILOT_DISABLED, US_GEO } from "./copilot/constants";

export async function getIntelligenceEndpoint (orgId: string) {
    const { tstUrl, preprodUrl, prodUrl } = convertGuidToUrls(orgId);
    const endpoints = [tstUrl, preprodUrl, prodUrl];

    const artemisResponse = await fetchDataParallel(endpoints);
    
    if (!artemisResponse) {
        return null;
    }

    const { clusterNumber, geoName, environment } = artemisResponse[0];

    if(geoName !== US_GEO) {
        return COPILOT_DISABLED;
    }

    const intelligenceEndpoint = `https://aibuildertextapiservice.${geoName}-il${clusterNumber}.gateway.${environment}.island.powerapps.com/v1.0/${orgId}/appintelligence/chat`

    return intelligenceEndpoint;
    
}

async function fetchDataParallel(endpoints: string[]) {

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
          console.error(`Request failed for ${endpoint}:`, error);
          return null;
        }
      });
  
      const responses = await Promise.all(promises);
      const successfulResponses = responses.filter(response => response !== null);
      return successfulResponses;
    } catch (error) {
      console.error('Error:', error);
      // Handle the error as needed
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

export async function fetchIslandData(endpoint: string) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error('Request failed');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        // Handle the error as needed
    }
}
