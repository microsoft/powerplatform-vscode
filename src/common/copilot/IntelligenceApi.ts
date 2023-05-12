/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";

const apiKey = "YOUR_API_KEY_HERE";
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
    const endpointUrl = "https://api.openai.com/v1/chat/completions";
    const requestBody = {
        'model': "gpt-3.5-turbo",
        messages: conversation,
        max_tokens: 1000,
        temperature: 0.5,
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
