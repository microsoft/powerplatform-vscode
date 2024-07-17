/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


/**
 * Request body for NL2Site service
 {
	"crossGeoOptions": {
		"enableCrossGeoCall": true
	},
	"question": "Create a site for selling books",
	"context": {
		"sessionId": "f754a29c-8877-4070-96e2-74f81bceacde",
		"scenario": "NL2Site",
		"subScenario": "GenerateNewSite",
		"version": "V1",
		"information": {
			"minPages": 7,
			"maxPages": 7
		}
	}
}
 */
//make fetch call to nl2 site service

export async function getNL2SiteData(aibEndpoint:string, aibToken: string, userPrompt: string) {
    const requestBody = {
        "crossGeoOptions": {
            "enableCrossGeoCall": true
        },
        "question": userPrompt,
        "context": {
            "sessionId": "f754a29c-8877-4070-96e2-74f81bceacde",
            "scenario": "NL2Site",
            "subScenario": "GenerateNewSite",
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
        return response.json();
    } catch (error) {
        return null;
    }
}

