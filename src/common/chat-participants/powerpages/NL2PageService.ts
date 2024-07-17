/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Request body for NL2Page service
 * {
	"crossGeoOptions": {
		"enableCrossGeoCall": true
	},
	"question": "Develop a course catalog management system for academic officials to manage and process course information and updates submitted for various courses offered by the institution. - Home page",
	"context": {
		"shouldCheckBlockList": false,
		"sessionId": "4ddbb858-c674-4214-a198-d898b2593bca",
		"scenario": "NL2Page",
		"subScenario": "GenerateNewPage",
		"version": "V1",
		"information": {
			"scope": "Page",
			"includeImages": true,
			"pageType": "Home",
			"title": "Course Catalog Manager",
			"pageName": "Home",
			"colorNumber": 8,
			"shuffleImages": false,
			"exampleNumber": 1
		}
	}
}
    */
//make fetch call to nl2 page service

export async function getNL2PageData(aibEndpoint:string, aibToken: string, userPrompt: string) {

    const pageTypes = ['Home', 'About Us', 'Contact Us', 'FAQ'];

    //make fetch call to nl2 page service for each page type

    const requests = pageTypes.map(async pageType => {
        const requestBody = {
            "crossGeoOptions": {
                "enableCrossGeoCall": true
            },
            "question": userPrompt,
            "context": {
                "shouldCheckBlockList": false,
                "sessionId": "4ddbb858-c674-4214-a198-d898b2593bca",
                "scenario": "NL2Page",
                "subScenario": "GenerateNewPage",
                "version": "V1",
                "information": {
                    "scope": "Page",
                    "includeImages": true,
                    "pageType": pageType,
                    "title": "Course Catalog Manager",
                    "pageName": pageType,
                    "colorNumber": 8,
                    "shuffleImages": false,
                    "exampleNumber": 1
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
    });

    const responses = await Promise.all(requests);
    return responses;
}
