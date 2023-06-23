/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { getCommonHeaders } from "../common/authenticationProvider";
import { httpMethod, ODATA_ETAG, queryParameters } from "../common/constants";
import { IAttributePath } from "../common/interfaces";
import { PortalsFS } from "../dal/fileSystemProvider";
import { telemetryEventNames } from "../telemetry/constants";
import { GetFileContent } from "../utilities/commonUtil";
import {
    getFileEntityId,
    getFileEntityType,
} from "../utilities/fileAndEntityUtil";
import { getRequestURL } from "../utilities/urlBuilderUtil";
import WebExtensionContext from "../WebExtensionContext";

export class EtagHandlerService {
    public static async getLatestAndUpdateMetadata(
        fileFsPath: string,
        portalFs: PortalsFS
    ): Promise<string> {
        const entityName = getFileEntityType(fileFsPath);
        const entityId = getFileEntityId(fileFsPath);

        const requestSentAtTime = new Date().getTime();

        const entityEtag =
            WebExtensionContext.fileDataMap.getFileMap.get(
                fileFsPath
            )?.entityEtag;

        const dataverseOrgUrl = WebExtensionContext.urlParametersMap.get(
            queryParameters.ORG_URL
        ) as string;

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
                headers: getCommonHeaders(
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
                '',
                true,
                0,
                undefined,
                telemetryEventNames.WEB_EXTENSION_ETAGHANDLERSERVICE
            );

            await WebExtensionContext.reAuthenticate();
            const response = await fetch(requestUrl, requestInit);

            if (response.ok) {
                const result = await response.json();
                const currentContent = new TextDecoder().decode(
                    await portalFs.readFile(vscode.Uri.parse(fileFsPath))
                );
                const latestContent = GetFileContent(result, attributePath);

                if (currentContent !== latestContent) {
                    WebExtensionContext.entityDataMap.updateEtagValue(
                        entityId,
                        result[ODATA_ETAG]
                    );

                    WebExtensionContext.telemetry.sendInfoTelemetry(
                        telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_CHANGED
                    );

                    return latestContent;
                }

                WebExtensionContext.telemetry.sendInfoTelemetry(
                    telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_SAME
                );
            } else if (response.status === 304) {
                WebExtensionContext.telemetry.sendInfoTelemetry(
                    telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_SAME
                );
            } else {
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    entityName,
                    httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    response.statusText,
                    '',
                    telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_UNEXPECTED_RESPONSE,
                    response.status as unknown as string
                );
            }

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                entityName,
                httpMethod.GET,
                new Date().getTime() - requestSentAtTime
            );
        } catch (error) {
            if ((error as Response)?.status>0){
                const authError = (error as Error)?.message;
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    entityName,
                    httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    authError,
                    '',
                    telemetryEventNames.WEB_EXTENSION_ETAGHANDLERSERVICE_API_ERROR,
                    (error as Response)?.status as unknown as string
                );
            }else{
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_ETAGHANDLERSERVICE_ERROR,
                    (error as Error)?.message
                );
            }
            
        }

        return "";
    }
}
