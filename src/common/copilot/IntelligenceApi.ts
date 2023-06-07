/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// import https from 'https';
import fetch, { RequestInit } from "node-fetch";
import { apiToken} from "./PowerPagesCopilot";
//import { intelligenceAPIAuthentication } from "../../web/client/common/authenticationProvider";
import https from 'https';

//let apiKey = "";
// intelligenceAPIAuthentication().then((token) => {
//     console.log('token: ' + token);
//     apiKey = token;
// });

export async function sendApiRequest(message: string, activeFilePath: string, activeFileContent: string) {
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

    const AIBTestUrl = "https://localhost:5001/v1.0/9ba620dc-4b37-430e-b779-2f9a7e7a52a6/appintelligence/chat";

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
          "sessionId": "2c4db921-be75-43fe-8fec-e4d65bd7546c",
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

    const response = await fetch(AIBTestUrl, {
        ...requestInit,
        agent: agent
    });

    if (response.ok) {
        console.log("API call successful");
        const jsonResponse = await response.json();
        //const responseMessage = jsonResponse.choices[0].message.content.trim();
        const responseMessage = jsonResponse.additionalData[0].properties.response;
        console.log("Response message:", responseMessage);
        // conversation.push({ role: "assistant", content: responseMessage });
        return responseMessage;
    } else {
        console.log("API call failed");
        const errorResponse = await response.json();
        console.log("Error message:", errorResponse.error.message);
    }
}