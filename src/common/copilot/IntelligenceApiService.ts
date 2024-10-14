/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import * as https from "https";
import { INAPPROPRIATE_CONTENT, INPUT_CONTENT_FILTERED, INVALID_INFERENCE_INPUT, InvalidResponse, MalaciousScenerioResponse, NetworkError, PROMPT_LIMIT_EXCEEDED, PromptLimitExceededResponse, RELEVANCY_CHECK_FAILED, RateLimitingResponse, UnauthorizedResponse } from "./constants";
import { sendTelemetryEvent } from "./telemetry/copilotTelemetry";
import { CopilotResponseFailureEvent, CopilotResponseFailureEventWithMessage, CopilotResponseOkFailureEvent, CopilotResponseSuccessEvent } from "./telemetry/telemetryConstants";
import { getExtensionType, getExtensionVersion } from "../utilities/Utils";
import { EXTENSION_NAME, IApiRequestParams } from "../constants";
import { enableCrossGeoDataFlowInGeo } from "./utils/copilotUtil";

const clientType = EXTENSION_NAME + '-' + getExtensionType();
const clientVersion = getExtensionVersion();

export async function sendApiRequest(params: IApiRequestParams) {
    const {
        userPrompt,
        activeFileParams,
        orgID,
        apiToken,
        sessionID,
        entityName,
        entityColumns,
        telemetry,
        aibEndpoint,
        geoName,
        crossGeoDataMovementEnabledPPACFlag = false,
        relatedFiles
    } = params;


    if (!aibEndpoint) {
        return NetworkError;
    }

    const aibEndpointLocal = 'https://localhost:5001/v1.0/9ba620dc-4b37-430e-b779-2f9a7e7a52a6/appintelligence/chat';


    // eslint-disable-next-line prefer-const
    let requestBody = {
        "question": userPrompt[0].displayText,
        "top": 1,
        "context": {
            "sessionId": sessionID,
            "scenario": "PowerPagesProDev",
            "subScenario": "PowerPagesProDevGeneric",
            "version": "V2",
            "information": {
                "dataverseEntity": activeFileParams.dataverseEntity,
                "entityField": activeFileParams.entityField,
                "fieldType": activeFileParams.fieldType,
                "activeFileContent": userPrompt[0].code, //Active file content (selected code)
                "targetEntity": entityName,
                "targetColumns": entityColumns,
                "clientType": clientType,
                "clientVersion": clientVersion,
                "RelatedFiles": relatedFiles ? relatedFiles : [{ fileType: '', fileContent: '', fileName: '' }],
                "entityMetadata": params.entityMetadata
            }
        },
        "crossGeoOptions": {
            "enableCrossGeoCall": crossGeoDataMovementEnabledPPACFlag
        }
    };

    console.log(JSON.stringify(requestBody));

    if (geoName && enableCrossGeoDataFlowInGeo().includes(geoName)) {
        requestBody = {
            ...requestBody,
            "crossGeoOptions": {
                "enableCrossGeoCall": true
            }
        }
    }

    //Required for testing with localhost
    const agent = new https.Agent({
        rejectUnauthorized: false,
    });

    const isLocalHost = true;

    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            'Content-Type': "application/json",
            ...(isLocalHost
                ? {
                    'x-ms-client-principal-id': '9ba620dc-4b37-430e-b779-2f9a7e7a52a4',
                    'x-ms-client-tenant-id': '9ba620dc-4b37-430e-b779-2f9a7e7a52a3',
                }
                : {}),
            Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(requestBody),
        agent: agent,
    }

    // const requestInit: RequestInit = {
    //     method: "POST",
    //     headers: {
    //         'Content-Type': "application/json",
    //         Authorization: `Bearer ${apiToken}`,
    //     },
    //     body: JSON.stringify(requestBody),
    // }

    try {
        const startTime = performance.now();

        const response = await fetch(aibEndpointLocal, {
            ...requestInit
        });

        const endTime = performance.now();

        const responseTime = endTime - startTime;

        if (response.ok) {
            try {
                const jsonResponse = await response.json();

                if (jsonResponse.operationStatus === 'Success') {
                    sendTelemetryEvent(telemetry, { eventName: CopilotResponseSuccessEvent, copilotSessionId: sessionID, durationInMills: responseTime, orgId: orgID });
                    if (jsonResponse.additionalData && Array.isArray(jsonResponse.additionalData) && jsonResponse.additionalData.length > 0) {
                        const additionalData = jsonResponse.additionalData[0];
                        if (additionalData.properties && additionalData.properties.response) {
                            const responseMessage = additionalData.properties.response;
                            responseMessage.push(additionalData.suggestions.subCategory ?? '');
                            return responseMessage;
                        }
                    }
                }
                else {
                    const errorMessage = jsonResponse.error.messages[0]; //Error from AIB with status code 200
                    return [{ displayText: errorMessage, code: '' }];
                }
                throw new Error("Invalid response format");
            } catch (error) {
                sendTelemetryEvent(telemetry, { eventName: CopilotResponseOkFailureEvent, copilotSessionId: sessionID, error: error as Error, durationInMills: responseTime, orgId: orgID });
                return InvalidResponse;
            }
        } else {
            try {
                const errorResponse = await response.json();
                const errorCode = errorResponse.error && errorResponse.error.code;
                const errorMessage = errorResponse.error && errorResponse.error.messages[0];

                const responseError = new Error(errorMessage);
                sendTelemetryEvent(telemetry, { eventName: CopilotResponseFailureEventWithMessage, copilotSessionId: sessionID, responseStatus: String(response.status), error: responseError, durationInMills: responseTime, orgId: orgID });

                if (response.status === 429) {
                    return RateLimitingResponse
                }
                else if (response.status === 401) {
                    return UnauthorizedResponse;
                }
                else if (errorCode === RELEVANCY_CHECK_FAILED || errorCode === INAPPROPRIATE_CONTENT || errorCode === INPUT_CONTENT_FILTERED) {
                    return MalaciousScenerioResponse;
                } else if (errorCode === PROMPT_LIMIT_EXCEEDED || errorCode === INVALID_INFERENCE_INPUT) {
                    return PromptLimitExceededResponse;
                }
                else if (errorMessage) {
                    return InvalidResponse;
                }
            } catch (error) {
                sendTelemetryEvent(telemetry, { eventName: CopilotResponseFailureEvent, copilotSessionId: sessionID, responseStatus: String(response.status), error: error as Error, durationInMills: responseTime, orgId: orgID });
                return InvalidResponse;
            }
        }
    } catch (error) {
        sendTelemetryEvent(telemetry, { eventName: CopilotResponseFailureEvent, copilotSessionId: sessionID, error: error as Error, orgId: orgID });
        return NetworkError;
    }

}
