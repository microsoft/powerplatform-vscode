/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { getHeader } from "../common/authenticationProvider";
import { httpMethod, ODATA_ETAG, queryParameters } from "../common/constants";
import { telemetryEventNames } from "../telemetry/constants";
import { GetFileContent } from "../utilities/commonUtil";
import { IAttributePath } from "../utilities/schemaHelperUtil";
import { getRequestURL } from "../utilities/urlBuilderUtil";
import WebExtensionContext from "../WebExtensionContext";

export class EtagHandlerService {
    public static async updateFileEtag(fileFsPath: string) {
        console.log("Updating file etag");
        const entityName = WebExtensionContext.fileDataMap.getFileMap.get(
            fileFsPath
        )?.entityName as string;
        const entityId = WebExtensionContext.fileDataMap.getFileMap.get(
            fileFsPath
        )?.entityId as string;

        const requestSentAtTime = new Date().getTime();
        const fileExtensionType =
            WebExtensionContext.fileDataMap.getFileMap.get(
                fileFsPath
            )?.entityFileExtensionType;

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
            httpMethod.PATCH,
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
                httpMethod.GET,
                fileExtensionType
            );

            await WebExtensionContext.reAuthenticate();
            const response = await fetch(requestUrl, requestInit);

            if (response.ok) {
                console.log("Updating file etag", response.ok);
                const result = await response.json();
                console.log("Updating file etag", result);
                console.log(
                    "Updating file etag",
                    result[ODATA_ETAG],
                    GetFileContent(result, attributePath)
                );
                WebExtensionContext.entityDataMap.updateEtagValue(
                    entityId,
                    result[ODATA_ETAG]
                );
                WebExtensionContext.entityDataMap.updateEntityColumnContent(
                    entityId,
                    attributePath,
                    GetFileContent(result, attributePath)
                );
                WebExtensionContext.fileDataMap.updateDirtyChanges(
                    fileFsPath,
                    false
                ); // Reset dirty changes - diff view will be triggered
                console.log("Updating file etag", "done");

                WebExtensionContext.telemetry.sendInfoTelemetry(
                    telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_CHANGED
                );
            } else if (response.status === 304) {
                console.log("Updating file etag", response.status);
                WebExtensionContext.telemetry.sendInfoTelemetry(
                    telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_SAME
                );
            } else {
                throw new Error(response.statusText);
            }

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                entityName,
                httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                fileExtensionType
            );
        } catch (error) {
            const authError = (error as Error)?.message;
            WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                requestUrl,
                entityName,
                httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                authError,
                fileExtensionType
            );
        }
    }
}
