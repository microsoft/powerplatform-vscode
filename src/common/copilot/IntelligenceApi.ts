/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// import https from 'https';
import fetch, { RequestInit } from "node-fetch";
import { apiToken, sessionID} from "./PowerPagesCopilot";
//import { intelligenceAPIAuthentication } from "../../web/client/common/authenticationProvider";
import https from 'https';

//let apiKey = "";
// intelligenceAPIAuthentication().then((token) => {
//     console.log('token: ' + token);
//     apiKey = token;
// });

export async function sendApiRequest(message: string, activeFilePath: string, activeFileContent: string, orgID:string) {
    console.log("Sending message to API: " + message);
    // conversation.push({ role: "user", content: message });
    // console.log("Conversation: ", conversation.length)
    // const endpointUrl = "https://api.openai.com/v1/chat/completions";
    // const requestBody = {
    //     'model': "gpt-3.5-turbo",
    //     messages: conversation,
    //     max_tokens: 2000,
    //     temperature: 0.2,
    // };

    // const AIBTestUrl = "https://localhost:5001/v1.0/9ba620dc-4b37-430e-b779-2f9a7e7a52a6/appintelligence/chat";
    const AIBTestUrl = "https://localhost:5001/v1.0/"+ orgID +"/appintelligence/chat";
    console.log("orgID", orgID)
    console.log("sessionID", sessionID)
    console.log("Input message", message);

    const hashMap: { [key: string]: string } = {
        entityList: "PowerPagesProDevList",
        entityForm: "PowerPagesProDevForm",
        webAPI: "PowerPagesProDevWebAPI",
      };

    const defaultValue = "PowerPagesProDevGeneric";
    const type = message.split(" ")[0].slice(1);
    const scenario = hashMap[type] || defaultValue;
    let realPrompt = message;
    if (scenario !== defaultValue){
        realPrompt = message.split(type).slice(1).join("");
    }

    console.log("Input message", realPrompt);

    const requestBody = {
        "question": realPrompt,//"Add a div with 3 cards having nice animations purely using css",//,
        "top": 1,
        "context": {
          "sessionId": sessionID,
          "scenario": "PowerPagesProDev",
          //"subScenario": scenario,
          "subScenario": "PowerPagesProDevGeneric",
          "version": "V1",
          "information": {
            "activeFilePath": activeFilePath,
            "activeFileContent": activeFileContent,
          }
        }
    };
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
            if (jsonResponse.additionalData[0].properties.response){
            const responseMessage = jsonResponse.additionalData[0].properties.response;
            console.log("Response message:", responseMessage);
            return responseMessage;
            } else {
                return [{ displayText: "Oops! Something went wrong. Please try again. Error Code: 1", code: '' }];
            }
          } catch (error) {
            console.log("JSON parsing error:", error);
            return [{ displayText: "Oops! Invalid response from the server.", code: '' }];
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