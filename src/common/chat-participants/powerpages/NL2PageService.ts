/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export async function getNL2PageData(aibEndpoint: string, aibToken: string, userPrompt: string, siteName: string, sitePagesList: string[], sessionId: string) {
    const constructRequestBody = (pageType: string) => ({
        "crossGeoOptions": {
            "enableCrossGeoCall": true
        },
        "question": `${userPrompt} - ${pageType} page`,
        "context": {
            "shouldCheckBlockList": false,
            "sessionId": sessionId,
            "scenario": "NL2Page",
            "subScenario": "GenerateNewPage",
            "version": "V1",
            "information": {
                "scope": "Page",
                "includeImages": true,
                "pageType": pageType === 'FAQ' ? 'FAQ' : 'Home', //FAQ and About us have specific page types
                "title": siteName,
                "pageName": pageType,
                "colorNumber": 7,
                "shuffleImages": false,
                "exampleNumber": 2
            }
        }
    });

    const requests = sitePagesList.map(async pageType => {
        const requestBody = constructRequestBody(pageType);

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
                throw new Error(`Request failed for page type: ${pageType}`);
            }

            const responseData = await response.json();

            if (responseData && responseData.additionalData[0]) {
                return responseData.additionalData[0].snippets[0];
            }
            return null;
        } catch (error) {
            console.error(`Error fetching data for ${pageType}:`, error);
            return null;
        }
    });

    const responses = await Promise.all(requests);
    return responses.filter(response => response !== null);
}
