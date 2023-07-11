/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import { sessionID } from "./PowerPagesCopilot";
import { InvalidResponse, NetworkError } from "./constants";
import https from 'https';


export async function sendApiRequest(userPrompt: string, activeFileParams: string[], orgID: string, apiToken: string) {

  const AIBTestUrl = `https://localhost:5001/v1.0/27ed4e35-30f9-ed11-a66e-00224803ed7b/appintelligence/chat`


  const requestBody = {
    "question": userPrompt,
    "top": 1,
    "context": {
      "sessionId": sessionID,
      "scenario": "PowerPagesProDev",
      "subScenario": "PowerPagesProDevGeneric",
      "version": "V1",
      "information": {
        "dataverseEntity": activeFileParams[0],
        "entityField": activeFileParams[1],
        "fieldType": activeFileParams[2],
        "activeFileContent": '',
      }
    }
  };

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      'Content-Type': "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(requestBody),
  }

  try {
    const response = await fetch(AIBTestUrl, {
      ...requestInit,
      agent: agent
    });


    if (response.ok) {
      try {
        const jsonResponse = await response.json();
        if (jsonResponse.operationStatus === 'Success') {
          if (jsonResponse.additionalData && Array.isArray(jsonResponse.additionalData) && jsonResponse.additionalData.length > 0) {
            const additionalData = jsonResponse.additionalData[0];
            if (additionalData.properties && additionalData.properties.response) {
              const responseMessage = additionalData.properties.response;
              return responseMessage;
            }
          }
        }
        else {
          const errorMessage = jsonResponse.error.messages[0]; //Error from AIB with status code 200
          return [{ displayText: errorMessage, code: '' }];
        }
        throw new Error("Invalid response format");
      } catch (error) {
        return InvalidResponse;
      }
    } else {
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
    return NetworkError;
  }

}