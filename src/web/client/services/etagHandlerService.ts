/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { getHeader } from "../common/authenticationProvider";
import { httpMethod, ODATA_ETAG, queryParameters } from "../common/constants";
import { IAttributePath } from "../common/interfaces";
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
        fileFsPath: string
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
            true
        );

        const attributePath: IAttributePath =
            WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
                ?.attributePath as IAttributePath;

        try {
            const requestInit: RequestInit = {
                method: httpMethod.GET,
                headers: getHeader(WebExtensionContext.dataverseAccessToken),
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
                httpMethod.GET
            );

            await WebExtensionContext.reAuthenticate();
            const response = await fetch(requestUrl, requestInit);

            if (response.ok) {
                const result = await response.json();
                WebExtensionContext.entityDataMap.updateEtagValue(
                    entityId,
                    result[ODATA_ETAG]
                );

                WebExtensionContext.telemetry.sendInfoTelemetry(
                    telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_CHANGED
                );

                return GetFileContent(result, attributePath);
            } else if (response.status === 304) {
                WebExtensionContext.telemetry.sendInfoTelemetry(
                    telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_SAME
                );
            } else {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_UNEXPECTED_RESPONSE,
                    response.statusText
                );
            }

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                entityName,
                httpMethod.GET,
                new Date().getTime() - requestSentAtTime
            );
        } catch (error) {
            const authError = (error as Error)?.message;
            WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                requestUrl,
                entityName,
                httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                authError
            );
        }

        return "";
    }
}
