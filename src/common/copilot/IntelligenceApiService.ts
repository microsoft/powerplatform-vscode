/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import { GEO_REQUIRES_CROSS_GEO_OPTIONS, INAPPROPRIATE_CONTENT, INPUT_CONTENT_FILTERED, INVALID_INFERENCE_INPUT, InvalidResponse, MalaciousScenerioResponse, NetworkError, PROMPT_LIMIT_EXCEEDED, PromptLimitExceededResponse, RELEVANCY_CHECK_FAILED, RateLimitingResponse, UnauthorizedResponse, UserPrompt } from "./constants";
import { IActiveFileParams } from "./model";
import { sendTelemetryEvent } from "./telemetry/copilotTelemetry";
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { CopilotResponseFailureEvent, CopilotResponseFailureEventWithMessage, CopilotResponseOkFailureEvent, CopilotResponseSuccessEvent } from "./telemetry/telemetryConstants";
import { getExtensionType, getExtensionVersion } from "../Utils";
import { EXTENSION_NAME } from "../../client/constants";

const clientType = EXTENSION_NAME + '-' + getExtensionType();
const clientVersion = getExtensionVersion();

export async function sendApiRequest(userPrompt: UserPrompt[], activeFileParams: IActiveFileParams, orgID: string, apiToken: string, sessionID: string, entityName: string, entityColumns: string[], telemetry: ITelemetry, aibEndpoint: string | null, geoName: string | null) {

    if (!aibEndpoint) {
        return NetworkError;
    }

    // eslint-disable-next-line prefer-const
    let requestBody = {
        "question": userPrompt[0].displayText,
        "top": 1,
        "context": {
            "sessionId": sessionID,
            "scenario": "PowerPagesProDev",
            "subScenario": "PowerPagesProDevGeneric",
            "version": "V1",
            "information": {
                "dataverseEntity": activeFileParams.dataverseEntity,
                "entityField": activeFileParams.entityField,
                "fieldType": activeFileParams.fieldType,
                "activeFileContent": userPrompt[0].code, //Active file content (selected code)
                "targetEntity": entityName,
                "targetColumns": entityColumns,
                "clientType": clientType,
                "clientVersion": clientVersion,
            }
        },
        "crossGeoOptions": {
            "enableCrossGeoCall": false
        }
    };

    if (geoName && GEO_REQUIRES_CROSS_GEO_OPTIONS.includes(geoName)) {
        requestBody = {
            ...requestBody,
            "crossGeoOptions": {
                "enableCrossGeoCall": true
            }
        }
    }


    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            'Content-Type': "application/json",
            Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(requestBody),
    }

    try {
        const startTime = performance.now();

        const response = await fetch(aibEndpoint, {
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
