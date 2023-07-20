/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import { InvalidResponse, NetworkError } from "./constants";
import { IActiveFileParams } from "./model";
import { sendTelemetryEvent } from "./telemetry/copilotTelemetry";
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { CopilotResponseFailureEvent, CopilotResponseSuccessEvent } from "./telemetry/telemetryConstants";


export async function sendApiRequest(userPrompt: string, activeFileParams: IActiveFileParams, orgID: string, apiToken: string, sessionID: string, entityName: string, entityColumns: string[], telemetry:ITelemetry, aibEndpoint: string | null) {

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
    const startTime = performance.now();

    const response = await fetch(aibEndpoint, {
      ...requestInit
    });

    const endTime = performance.now();

    const responseTime = endTime - startTime;

    if (response.ok) {
      try {
        const jsonResponse = await response.json();
        if (jsonResponse.operationStatus === 'Success') {
          sendTelemetryEvent(telemetry, { eventName: CopilotResponseSuccessEvent, copilotSessionId: sessionID, durationInMills: responseTime });
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        sendTelemetryEvent(telemetry, { eventName: CopilotResponseFailureEvent, copilotSessionId: sessionID, error: error, durationInMills: responseTime });
        return InvalidResponse;
      }
    } else {
      //TODO: Log error
      try {
        const errorResponse = await response.json();
        sendTelemetryEvent(telemetry, { eventName: CopilotResponseFailureEvent, copilotSessionId: sessionID, error: errorResponse.error.messages[0], durationInMills: responseTime});
        if(response.status >= 500 && response.status < 600) {
          return InvalidResponse
        }
        if (errorResponse.error && errorResponse.error.messages[0]) {
          return [{ displayText: errorResponse.error.messages[0], code: '' }];
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        sendTelemetryEvent(telemetry, { eventName: CopilotResponseFailureEvent, copilotSessionId: sessionID, error: error});
        return InvalidResponse;
      }
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    sendTelemetryEvent(telemetry, { eventName: CopilotResponseFailureEvent, copilotSessionId: sessionID, error: error});
    return NetworkError;
  }

}