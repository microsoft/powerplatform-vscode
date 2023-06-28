/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import { apiToken, sessionID} from "./PowerPagesCopilot";
import https from 'https';


export async function sendApiRequest(userPrompt: string, activeFilePath: string, activeFileContent: string, orgID:string) {
    console.log("Sending message to API: " + userPrompt);

    // const AIBTestUrl = "https://localhost:5001/v1.0/9ba620dc-4b37-430e-b779-2f9a7e7a52a6/appintelligence/chat";
   // const AIBTestUrl = "https://localhost:5001/v1.0/"+ orgID +"/appintelligence/chat";
   const AIBTestUrl = `https://aibuildertextapiservice.us-il201.gateway.test.island.powerapps.com/v1.0/${orgID}/appintelligence/chat`
    console.log("orgID", orgID)
    console.log("sessionID", sessionID)
 


    const requestBody = {
        "question": userPrompt,
        "top": 1,
        "context": {
          "sessionId": sessionID,
          "scenario": "PowerPagesProDev",
          "subScenario": "PowerPagesProDevGeneric",
          "version": "V1",
          "information": {
            "activeFilePath": activeFilePath,
            "activeFileContent": activeFileContent,
          }
        }
    };

    //TODO: Remove this once we have test API endpoint working
    // Create a custom agent with disabled SSL certificate validation
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
          console.log("API call successful");
          try {
            const jsonResponse = await response.json();
            if (jsonResponse.additionalData && Array.isArray(jsonResponse.additionalData) && jsonResponse.additionalData.length > 0) {
              const additionalData = jsonResponse.additionalData[0];
              if (additionalData.properties && additionalData.properties.response) {
                const responseMessage = additionalData.properties.response;
                console.log("Response message:", responseMessage);
                return responseMessage;
              }
            }
            throw new Error("Invalid response format");
          } catch (error) {
            console.log("Error:", error);
            return [{ displayText: "Oops! Something went wrong. Please try again. Error Code: 1", code: '' }];
          }
        } else {
          console.log("API call failed");
          try {
            const errorResponse = await response.json();
            console.log("Error message:", errorResponse.error.message);
            return [{ displayText: "Oops! Something went wrong. Please try again. " + response.status.toString() , code: '' }];
          } catch (error) {
            console.log("JSON parsing error:", error);
            return [{ displayText: "Oops! Invalid response from the server. " + response.status.toString() , code: '' }];
          }
        }
      } catch (error) {
        console.log("Network error:", error);
        return [{ displayText: "Oops! Network error. Please try again.", code: '' }];
      }
      
}