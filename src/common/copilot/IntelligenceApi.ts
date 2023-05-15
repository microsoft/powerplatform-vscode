/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import { intelligenceAPIAuthentication } from "../../web/client/common/authenticationProvider";

let apiKey = "";
intelligenceAPIAuthentication().then((token) => {
    console.log('token: ' + token);
    apiKey = token;
});
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
    const AIBTestUrl = "https://aibuildertextapiservice.wus-il001.gateway.test.island.powerapps.com/v1.0/9ba620dc-4b37-430e-b779-2f9a7e7a52a5/smart/model/463431f3-b8fc-44af-ae51-d8f83d4ca52f/complete";

    console.log("messgae123", message);
    const requestBody = {
        "prompt": message,
        "source": "chatGpt",
        "stop": "[###]"
    };

    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            'Content-Type': "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
    }
    const response = await fetch(AIBTestUrl, requestInit);

    if (response.ok) {
        console.log("API call successful");
        const jsonResponse = await response.json();
        console.log("AIB Response:", jsonResponse);
        const responseMessage = jsonResponse.choices[0].text.trim();
        conversation.push({ role: "assistant", content: responseMessage });
        return responseMessage;
    } else {
        console.log("API call failed");
        const errorResponse = await response.json();
        console.log("Error message:", errorResponse.error.message);
    }
}
