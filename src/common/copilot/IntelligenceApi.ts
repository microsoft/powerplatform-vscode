/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// import https from 'https';
import fetch, { RequestInit } from "node-fetch";
import { conversation } from "./PowerPagesCopilot";
//import { intelligenceAPIAuthentication } from '../../web/client/common/authenticationProvider';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const apiKey = "";
// intelligenceAPIAuthentication().then((token) => {
//     console.log('token: ' + token);
//     apiKey = token;
// });


export async function sendApiRequest(message: string) {
    console.log("Sending message to API: " + message);
    conversation.push({ role: "user", content: message });
    console.log("Conversation: ", conversation.length)
    const endpointUrl = "https://api.openai.com/v1/chat/completions";
    const requestBody = {
        'model': "gpt-3.5-turbo",
        messages: conversation,
        max_tokens: 2000,
        temperature: 0.2,
    };

    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            'Content-Type': "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
    }
    const response = await fetch(endpointUrl, requestInit);

    if (response.ok) {
        console.log("API call successful");
        const jsonResponse = await response.json();
        const responseMessage = jsonResponse.choices[0].message.content.trim();
        conversation.push({ role: "assistant", content: responseMessage });
        return responseMessage;
    } else {
        console.log("API call failed");
        const errorResponse = await response.json();
        console.log("Error message:", errorResponse.error.message);
    }
}