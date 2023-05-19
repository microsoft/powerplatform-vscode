/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import https from 'https';
import fetch, { RequestInit } from "node-fetch";
// import { intelligenceAPIAuthentication } from "../../web/client/common/authenticationProvider";

// let apiKey = "";
// intelligenceAPIAuthentication().then((token) => {
//     console.log('token: ' + token);
//     apiKey = token;
// });
const conversation = [
    {
        role: "system",
        content:
            "You are a web developer well versed with css, html and javascript who is using the power pages platform which was formerly known as powerapps portals. It mostly uses html, css, javascript for development. You put code block in markdown syntax",
    },
];

export async function sendApiRequest(message: string) {
    console.log("Sending message to API: " + message);
    conversation.push({ role: "user", content: message });
    //const endpointUrl = "https://api.openai.com/v1/chat/completions";
    const AIBTestUrl = "https://localhost:5001/v1.0/9ba620dc-4b37-430e-b779-2f9a7e7a52a6/appintelligence/chat";

    //console.log("messgae123", message);
    // const requestBody = {
    //     "prompt": message,
    //     "source": "chatGpt",
    //     "stop": "[###]"
    // };

    const requestBody = {
        "question": message,
        "top": 1,
        "context": {
            "sessionId": "2c4db921-be75-43fe-8fec-e4d65bd7546c",
            "scenario": "NL2Page",
            "subScenario": "GenerateNewPage",
            "version": "V1",
            "information": {
                "scope": "Page",
                "title": "Woodland Bank",
                "includeImages": true
            }
        }

    }

    // Create a custom agent with disabled SSL certificate validation
    const agent = new https.Agent({
    rejectUnauthorized: false
    });

    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            'Content-Type': "application/json",
            //Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        redirect: 'follow'
    }
    const response = await fetch(AIBTestUrl, {
        ...requestInit,
        agent: agent
      });

    if (response.ok) {
        console.log("API call successful");
        const jsonResponse = await response.json();
        console.log("AIB Response:", jsonResponse);
        const responseMessage = jsonResponse.additionalData[0].snippets[0].code;
        // conversation.push({ role: "assistant", content: responseMessage });
        return "```" + responseMessage + "```";
    } else {
        console.log("API call failed");
        const errorResponse = await response.json();
        console.log("Error message:", errorResponse.error.message);
    }
}
