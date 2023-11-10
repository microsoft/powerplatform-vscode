/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import path from "path";
import WebExtensionContext from "../WebExtensionContext";
import { getCommonHeaders } from "../common/authenticationProvider";
import * as Constants from "../common/constants";
import { telemetryEventNames } from "../telemetry/constants";

export async function requestGraphClient(graphToken: string, service: string, userId: string) {
    let requestSentAtTime = new Date().getTime();

    const basePath = Constants.MICROSOFT_GRAPH_USERS_BASE_URL;
    let requestUrl;

    switch (service) {
        case Constants.GraphClientService.MAIL:
            requestUrl = new URL(userId, basePath);
            break;
        case Constants.GraphClientService.PROFILE_PICTURE:
            requestUrl = new URL(path.join(userId, Constants.MICROSOFT_GRAPH_PROFILE_PICTURE_SERVICE_CALL), basePath);
            break;
        default:
            return;
    }

    console.log("requestUrl: ", requestUrl.href);

    try {
        WebExtensionContext.telemetry.sendAPITelemetry(
            requestUrl.href,
            "",
            Constants.httpMethod.GET,
            requestGraphClient.name,
        )

        requestSentAtTime = new Date().getTime();

        const response = await WebExtensionContext.concurrencyHandler.handleRequest(
            requestUrl.href,
            {
                headers: {
                    ...getCommonHeaders(graphToken),
                },
            }
        );

        if(!response.ok) {
            throw new Error(JSON.stringify(response));
        }

        WebExtensionContext.telemetry.sendAPISuccessTelemetry(
            requestUrl.href,
            "",
            Constants.httpMethod.POST,
            new Date().getTime() - requestSentAtTime,
            requestGraphClient.name
        );

        return await response.json();
    } catch (error) {
        const errorMsg = (error as Error)?.message;
        if ((error as Response)?.status > 0) {
            WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                requestUrl.href,
                "",
                Constants.httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                requestGraphClient.name,
                errorMsg,
                '',
                (error as Response)?.status.toString()
            );
        } else {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                telemetryEventNames.WEB_EXTENSION_GET_FROM_GRAPH_CLIENT_FAILED,
                requestGraphClient.name,
                (error as Error)?.message,
                error as Error
            );
        }
    }
}
