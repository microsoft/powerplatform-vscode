/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export async function getNL2SiteData(aibEndpoint: string, aibToken: string, userPrompt: string, sessionId: string) {
    const requestBody = {
        "crossGeoOptions": {
            "enableCrossGeoCall": true
        },
        "question": userPrompt,
        "context": {
            "sessionId": sessionId,
            "scenario": "NL2Site",
            "subScenario": "GenerateNewSite",
            // "shouldCheckBlockList": false, // Check how to set to get value for this
            "version": "V1",
            "information": {
                "minPages": 7,
                "maxPages": 7
            }
        }
    };

    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${aibToken}`
        },
        body: JSON.stringify(requestBody)
    };

    try {
        const response = await fetch(aibEndpoint, requestInit);
        if (!response.ok) {
            throw new Error('Request failed');
        }

        const responseBody = await response.json();

        if (responseBody && responseBody.additionalData[0]?.website) {
            return responseBody.additionalData[0].website; // Contains the pages, siteName & site description
        }
    } catch (error) {
        return null;
    }
}

