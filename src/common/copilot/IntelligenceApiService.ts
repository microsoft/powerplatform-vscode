/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import {sessionID} from "./PowerPagesCopilot";
import { ActiveFileParams, InvalidResponse, NetworkError } from "./constants";


export async function sendApiRequest(userPrompt: string, activeFileParams: ActiveFileParams, orgID:string, apiToken:string) {

    const region = 'test';
    let aibEndpoint = '';

    //TODO: Add prod endpoint
    switch (region) {
        case 'test':
         aibEndpoint = `https://aibuildertextapiservice.wus-il001.gateway.test.island.powerapps.com/v1.0/${orgID}/appintelligence/chat`
          break;
        default:
          break;
      }
 
 
    const requestBody = {
        "question": userPrompt,
        "top": 1,
        "context": {
          "sessionId": sessionID,
          "scenario": "PowerPagesProDev",
          "subScenario": "PowerPagesProDevGeneric",
          "version": "V1",
          "information": {
            "dataverseEntity": activeFileParams.dataverseEntity,
            "entityField": activeFileParams.entityField,
            "fieldType": activeFileParams.fieldType,
            "activeFileContent": '',
          }
        }
    };


    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            'Content-Type': "application/json",
            Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(requestBody),
    }

    try {
        const response = await fetch(aibEndpoint, {
          ...requestInit
        });
      
        if (response.ok) {
          //TODO: Log Telemetry
          try {
            const jsonResponse = await response.json();
            if (jsonResponse.additionalData && Array.isArray(jsonResponse.additionalData) && jsonResponse.additionalData.length > 0) {
              const additionalData = jsonResponse.additionalData[0];
              if (additionalData.properties && additionalData.properties.response) {
                const responseMessage = additionalData.properties.response;
                return responseMessage;
              }
            }
            throw new Error("Invalid response format");
          } catch (error) {
            return InvalidResponse;
          }
        } else {
          //TODO: Log error
          try {
            const errorResponse = await response.json();
            if (errorResponse.error && errorResponse.error.messages[0]) {
              return [{ displayText: errorResponse.error.messages[0], code: '' }];
            }
          } catch (error) {
            return InvalidResponse;
          }
        }
      } catch (error) {
        //TODO: Log error
        return NetworkError;
      }
      
}