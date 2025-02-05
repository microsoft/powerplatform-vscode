/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NL2SITE_GENERATE_NEW_SITE, NL2SITE_INVALID_RESPONSE, NL2SITE_SCENARIO} from "../../PowerPagesChatParticipantConstants";
import {VSCODE_EXTENSION_NL2SITE_REQUEST_FAILED, VSCODE_EXTENSION_NL2SITE_REQUEST_SUCCESS } from "../../PowerPagesChatParticipantTelemetryConstants";
import { getCommonHeaders } from "../../../../services/AuthenticationProvider";
import { oneDSLoggerWrapper } from "../../../../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { ENGLISH, MAX_PAGES, MIN_PAGES } from "./CreateSiteConstants";

export async function getNL2SiteData(aibEndpoint: string, aibToken: string, userPrompt: string, sessionId: string, orgId: string, envId: string, userId: string) {
    const requestBody = {
        "crossGeoOptions": {
            "enableCrossGeoCall": true
        },
        "question": userPrompt,
        "context": {
            "sessionId": sessionId,
            "scenario": NL2SITE_SCENARIO,
            "subScenario": NL2SITE_GENERATE_NEW_SITE,
            // "shouldCheckBlockList": false, //TODO: Check if this is needed
            "version": "V1",
            "information": {
                "minPages": MIN_PAGES,
                "maxPages": MAX_PAGES,
                "language": ENGLISH

            }
        }
    };

    const requestInit: RequestInit = {
        method: "POST",
        headers: getCommonHeaders(aibToken),
        body: JSON.stringify(requestBody)
    };

    try {
        const response = await fetch(aibEndpoint, requestInit);
        if (!response.ok) {
            throw new Error(`${response.statusText} - ${response.status}`);
        }

        const responseBody = await response.json();

        if (responseBody && responseBody.additionalData[0]?.website) {
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_NL2SITE_REQUEST_SUCCESS, { sessionId: sessionId, orgId: orgId, environmentId: envId, userId: userId });
            return responseBody.additionalData[0].website; // Contains the pages, siteName & site description
        } else {
            throw new Error(NL2SITE_INVALID_RESPONSE);
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_NL2SITE_REQUEST_FAILED, error as string, error as Error, { sessionId: sessionId, orgId:orgId, envId: envId, userId: userId}, {});
        return null;
    }
}
