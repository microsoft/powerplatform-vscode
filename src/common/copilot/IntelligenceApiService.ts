/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import { InvalidResponse, NetworkError } from "./constants";
import { IActiveFileParams } from "./model";


export async function sendApiRequest(userPrompt: string, activeFileParams: IActiveFileParams, orgID: string, apiToken: string, sessionID: string, entityName: string, entityColumns: string[], aibEndpoint: string | null) {

  // const region = 'test';
  // let aibEndpoint = '';

  // aibEndpoint = getAibEndpoint(region, orgID);
  if(!aibEndpoint) {
    return NetworkError;
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
        "targetEntity": entityName, 
        "targetColumns": entityColumns 
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