/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";

const apiKey = "YOUR_API_KEY_HERE";

export async function sendApiRequest(message: string) {
    console.log("Sending message to API: " + message);
    const endpointUrl = "https://api.openai.com/v1/chat/completions";
    // const requestBody: BodyInit = {
    //     'model': "gpt-3.5-turbo",
    //     messages: message,
    //     max_tokens: 1000,
    //     temperature: 0.5,
    // };
    const data: { [k: string]: string } = {};
    data["model"] = "gpt-3.5-turbo";
    data["messages"] = message;
    data["max_tokens"] = "1000";
    data["temperature"] = "0.5";
    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            'Content-Type': "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
    }
    const response = await fetch(endpointUrl, requestInit);

    if (response.ok) {
        console.log("API call successful");
        const jsonResponse = await response.json();
        const responseMessage = jsonResponse.choices[0].message.content.trim();
        // addMessage(responseMessage, "api-response");
        return responseMessage;
    } else {
        console.log("API call failed");
        // Handle the API error, e.g., display an error message
    }

    // addMessage('This is a dummy response to your message : ' + message, 'api-response');
}
