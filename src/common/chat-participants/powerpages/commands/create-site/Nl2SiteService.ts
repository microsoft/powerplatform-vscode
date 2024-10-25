/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../../../../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { NL2SITE_INVALID_RESPONSE, VSCODE_EXTENSION_NL2SITE_REQUEST_FAILED, VSCODE_EXTENSION_NL2SITE_REQUEST_SUCCESS } from "../../PowerPagesChatParticipantConstants";

export async function getNL2SiteData(aibEndpoint: string, aibToken: string, userPrompt: string, sessionId: string, telemetry: ITelemetry) {
    const requestBody = {
        "crossGeoOptions": {
            "enableCrossGeoCall": true
        },
        "question": userPrompt,
        "context": {
            "sessionId": sessionId,
            "scenario": "NL2Site",
            "subScenario": "GenerateNewSite",
            // "shouldCheckBlockList": false, //TODO: Check if this is needed
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
            throw new Error(`${response.statusText} - ${response.status}`);
        }

        const responseBody = await response.json();

        if (responseBody && responseBody.additionalData[0]?.website) {
            telemetry.sendTelemetryEvent(VSCODE_EXTENSION_NL2SITE_REQUEST_SUCCESS, {sessionId: sessionId});
            return responseBody.additionalData[0].website; // Contains the pages, siteName & site description
        } else {
            throw new Error(NL2SITE_INVALID_RESPONSE);
        }
    } catch (error) {
        telemetry.sendTelemetryErrorEvent(VSCODE_EXTENSION_NL2SITE_REQUEST_FAILED, { error: (error as Error)?.message });
        return null;
    }
}
