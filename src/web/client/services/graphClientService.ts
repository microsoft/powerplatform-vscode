/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import path from "path";
import WebExtensionContext from "../WebExtensionContext";
import { getCommonHeaders, graphClientAuthentication } from "../../../common/services/AuthenticationProvider";
import * as Constants from "../common/constants";
import { webExtensionTelemetryEventNames } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { createHttpResponseError, isHttpResponseError } from "../utilities/errorHandlerUtil";

export class GraphClientService {
    private _graphToken: string;

    constructor() {
        this._graphToken = "";
    }

    get graphToken() {
        return this._graphToken;
    }

    public async graphClientAuthentication(firstTimeAuth = false) {
        const accessToken = await graphClientAuthentication(firstTimeAuth);
        if (!accessToken) {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_FAILED,
                graphClientAuthentication.name
            );
        }

        if (firstTimeAuth && accessToken) {
            WebExtensionContext.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_COMPLETED
            );
        }

        this._graphToken = accessToken;
    }

    private async requestGraphClient(
        service: string,
        userId: string
    ) {
        let requestSentAtTime = new Date().getTime();

        const basePath = Constants.MICROSOFT_GRAPH_USERS_BASE_URL;
        let requestUrl;

        switch (service) {
            case Constants.GraphService.GRAPH_MAIL:
                requestUrl = new URL(userId, basePath);
                break;
            case Constants.GraphService.GRAPH_PROFILE_PICTURE:
                requestUrl = new URL(
                    path.join(
                        userId,
                        Constants.MICROSOFT_GRAPH_PROFILE_PICTURE_SERVICE_CALL
                    ),
                    basePath
                );
                break;
            default:
                return;
        }

        try {
            WebExtensionContext.telemetry.sendAPITelemetry(
                requestUrl.href,
                service,
                Constants.httpMethod.GET,
                this.requestGraphClient.name
            );

            requestSentAtTime = new Date().getTime();

            const response =
                await WebExtensionContext.concurrencyHandler.handleRequest(
                    requestUrl.href,
                    {
                        headers: {
                            ...getCommonHeaders(this._graphToken),
                        },
                    }
                );

            if (!response.ok) {
                throw await createHttpResponseError(response);
            }

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                requestUrl.href,
                service,
                Constants.httpMethod.POST,
                new Date().getTime() - requestSentAtTime,
                this.requestGraphClient.name
            );

            return await response.json();
        } catch (error) {
            const errorMsg = (error as Error)?.message;
            if (isHttpResponseError(error) && error.httpDetails) {
                // HTTP error - use API failure telemetry with status code
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                    requestUrl.href,
                    service,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    this.requestGraphClient.name,
                    errorMsg,
                    "",
                    error.httpDetails.statusCode.toString()
                );
            } else {
                // System error (network failure, timeout, etc.)
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_GET_FROM_GRAPH_CLIENT_FAILED,
                    this.requestGraphClient.name,
                    Constants.WEB_EXTENSION_GET_FROM_GRAPH_CLIENT_FAILED,
                    error as Error
                );
            }
        }
    }

    public async getUserEmail(userId: string) {
        try {
            if (!this._graphToken) {
                await this.graphClientAuthentication(true);
            }

            const response = await this.requestGraphClient(
                Constants.GraphService.GRAPH_MAIL,
                userId
            );
            return await response.mail;
        } catch (error) {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_GET_EMAIL_FROM_GRAPH_CLIENT_FAILED,
                this.getUserEmail.name,
                (error as Error)?.message,
                error as Error
            );
        }
    }

    public async getUserProfilePicture(userId: string) {
        try {
            if (!this._graphToken) {
                await this.graphClientAuthentication(true);
            }

            const response = await this.requestGraphClient(
                Constants.GraphService.GRAPH_PROFILE_PICTURE,
                userId
            );
            return await response;
        } catch (error) {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_GET_PROFILE_PICTURE_FROM_GRAPH_CLIENT_FAILED,
                this.getUserProfilePicture.name,
                (error as Error)?.message,
                error as Error
            );
        }
    }
}
