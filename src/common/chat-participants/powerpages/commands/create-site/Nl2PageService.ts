/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../../../../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { NL2PAGE_REQUEST_FAILED, VSCODE_EXTENSION_NL2PAGE_REQUEST_FAILED, VSCODE_EXTENSION_NL2PAGE_REQUEST_SUCCESS } from "../../PowerPagesChatParticipantConstants";

export async function getNL2PageData(aibEndpoint: string, aibToken: string, userPrompt: string, siteName: string, sitePagesList: string[], sessionId: string, telemetry: ITelemetry) {
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
                "pageType": pageType === 'FAQ' ? 'FAQ' : 'Home',
                "title": siteName,
                "pageName": pageType,
                "colorNumber": 7, // Add a function to get a random number
                "shuffleImages": false,
                "exampleNumber": 2 // Add a function to get a random number
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
                throw new Error(`${NL2PAGE_REQUEST_FAILED} ${pageType}`);
            }

            const responseData = await response.json();

            if (responseData && responseData.additionalData[0]) {
                return responseData.additionalData[0].snippets[0];
            }
            return null;
        } catch (error) {
            telemetry.sendTelemetryErrorEvent(VSCODE_EXTENSION_NL2PAGE_REQUEST_FAILED, { error: (error as Error)?.message, pageType });
            return null;
        }
    });

    const responses = await Promise.all(requests);

    telemetry.sendTelemetryEvent(VSCODE_EXTENSION_NL2PAGE_REQUEST_SUCCESS, { sessionId });

    // TODO: Home page is mandatory, so if it is not generated, return null
    return responses.filter(response => response !== null);
}
