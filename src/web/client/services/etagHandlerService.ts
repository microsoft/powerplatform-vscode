/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { RequestInit } from "node-fetch";
import { getCommonHeadersForDataverse } from "../../../common/services/AuthenticationProvider";
import { httpMethod, ODATA_ETAG } from "../common/constants";
import { IAttributePath } from "../common/interfaces";
import { PortalsFS } from "../dal/fileSystemProvider";
import { webExtensionTelemetryEventNames } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { getAttributeContent } from "../utilities/commonUtil";
import {
    getFileEntityEtag,
    getFileEntityId,
    getFileEntityName,
    updateEntityEtag,
    updateFileEntityEtag,
} from "../utilities/fileAndEntityUtil";
import { getRequestURL } from "../utilities/urlBuilderUtil";
import WebExtensionContext from "../WebExtensionContext";
import { createHttpResponseError, isHttpResponseError } from "../utilities/errorHandlerUtil";

export class EtagHandlerService {
    public static async getLatestFileContentAndUpdateMetadata(
        fileFsPath: string,
        portalFs: PortalsFS
    ): Promise<string> {
        const entityName = getFileEntityName(fileFsPath);
        const entityId = getFileEntityId(fileFsPath);

        const requestSentAtTime = new Date().getTime();

        const entityEtag = getFileEntityEtag(fileFsPath);

        const dataverseOrgUrl = WebExtensionContext.orgUrl;

        const requestUrl = getRequestURL(
            dataverseOrgUrl,
            entityName,
            entityId,
            httpMethod.GET,
            true,
            false
        );

        const attributePath: IAttributePath =
            WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
                ?.attributePath as IAttributePath;

        try {
            const requestInit: RequestInit = {
                method: httpMethod.GET,
                headers: getCommonHeadersForDataverse(
                    WebExtensionContext.dataverseAccessToken
                ),
            };

            if (entityEtag) {
                requestInit.headers = {
                    ...requestInit.headers,
                    "If-None-Match": entityEtag,
                };
            }

            WebExtensionContext.telemetry.sendAPITelemetry(
                requestUrl,
                entityName,
                httpMethod.GET,
                this.getLatestFileContentAndUpdateMetadata.name,
                '',
                true,
                0,
                undefined,
                webExtensionTelemetryEventNames.WEB_EXTENSION_ETAG_HANDLER_SERVICE
            );

            await WebExtensionContext.dataverseAuthentication();
            const response = await WebExtensionContext.concurrencyHandler.handleRequest(requestUrl, requestInit);

            if (response.ok) {
                const result = await response.json();
                const currentContent = new TextDecoder().decode(
                    await portalFs.readFile(vscode.Uri.parse(fileFsPath))
                );
                const latestContent = getAttributeContent(result, attributePath, entityName, entityId);
                updateEntityEtag(entityId, result[ODATA_ETAG]);

                if (currentContent !== latestContent) {
                    WebExtensionContext.telemetry.sendInfoTelemetry(
                        webExtensionTelemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_CHANGED
                    );

                    return latestContent;
                }

                WebExtensionContext.telemetry.sendInfoTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_SAME
                );
            } else if (response.status === 304) {
                WebExtensionContext.telemetry.sendInfoTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_SAME
                );
            } else {
                throw await createHttpResponseError(response);
            }

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                entityName,
                httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                this.getLatestFileContentAndUpdateMetadata.name
            );
        } catch (error) {
            const errorMessage = (error as Error)?.message;
            if (isHttpResponseError(error) && error.httpDetails) {
                // HTTP error - use API failure telemetry with status code
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    entityName,
                    httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    this.getLatestFileContentAndUpdateMetadata.name,
                    errorMessage,
                    '',
                    error.httpDetails.statusCode.toString()
                );
            } else {
                // System error (network failure, timeout, etc.)
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_ETAG_HANDLER_SERVICE_ERROR,
                    this.getLatestFileContentAndUpdateMetadata.name,
                    errorMessage,
                    error as Error
                );
            }
        }

        return "";
    }

    public static async updateFileEtag(fileFsPath: string) {
        const entityName = getFileEntityName(fileFsPath);
        const entityId = getFileEntityId(fileFsPath);
        const requestSentAtTime = new Date().getTime();
        const dataverseOrgUrl = WebExtensionContext.orgUrl;
        const requestUrl = getRequestURL(
            dataverseOrgUrl,
            entityName,
            entityId,
            httpMethod.GET,
            true,
            false
        );

        try {
            const requestInit: RequestInit = {
                method: httpMethod.GET,
                headers: getCommonHeadersForDataverse(
                    WebExtensionContext.dataverseAccessToken
                ),
            };

            WebExtensionContext.telemetry.sendAPITelemetry(
                requestUrl,
                entityName,
                httpMethod.GET,
                this.updateFileEtag.name
            );

            await WebExtensionContext.dataverseAuthentication();
            const response = await WebExtensionContext.concurrencyHandler.handleRequest(requestUrl, requestInit);

            if (response.ok) {
                const result = await response.json();
                updateFileEntityEtag(
                    fileFsPath,
                    result[ODATA_ETAG]
                );
            } else {
                throw await createHttpResponseError(response);
            }

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                entityName,
                httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                this.updateFileEtag.name
            );
        } catch (error) {
            const errorMessage = (error as Error)?.message;
            if (isHttpResponseError(error) && error.httpDetails) {
                // HTTP error - use API failure telemetry with status code
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    entityName,
                    httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    this.updateFileEtag.name,
                    errorMessage,
                    '',
                    error.httpDetails.statusCode.toString()
                );
            } else {
                // System error (network failure, timeout, etc.)
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_ETAG_HANDLER_SERVICE_ERROR,
                    this.updateFileEtag.name,
                    errorMessage,
                    error as Error
                );
            }
        }
    }
}
