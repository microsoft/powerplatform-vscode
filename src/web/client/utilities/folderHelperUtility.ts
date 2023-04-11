/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import WebExtensionContext from "../WebExtensionContext";
import {
    ENABLE_MULTI_FILE_FEATURE,
    httpMethod,
    queryParameters,
} from "../common/constants";
import { schemaEntityKey } from "../schema/constants";
import { getEntity } from "./schemaHelperUtil";
import { getRequestURL } from "./urlBuilderUtil";

export interface IEntityRequestUrl {
    requestUrl: string;
    entityName: string;
}

export function getFolderSubUris(): string[] {
    const subUris: string[] = [];

    if (!ENABLE_MULTI_FILE_FEATURE) {
        const entityDetails = getEntity(WebExtensionContext.defaultEntityType);
        const subUri = entityDetails?.get(schemaEntityKey.FILE_FOLDER_NAME);
        return [subUri as string];
    }

    WebExtensionContext.schemaEntitiesMap.forEach((entityDetails) => {
        const subUri = entityDetails?.get(
            schemaEntityKey.FILE_FOLDER_NAME
        ) as string;

        subUris.push(subUri);
    });

    return subUris;
}

export function getRequestUrlForEntities(): IEntityRequestUrl[] {
    const requestURLs: IEntityRequestUrl[] = [];
    const dataverseOrgUrl = WebExtensionContext.urlParametersMap.get(
        queryParameters.ORG_URL
    ) as string;

    if (!ENABLE_MULTI_FILE_FEATURE) {
        const requestURL = getRequestURL(
            dataverseOrgUrl,
            WebExtensionContext.defaultEntityType,
            WebExtensionContext.defaultEntityId,
            httpMethod.GET,
            false
        );
        return [
            {
                requestUrl: requestURL,
                entityName: WebExtensionContext.defaultEntityType,
            },
        ];
    }

    WebExtensionContext.schemaEntitiesMap.forEach(
        (entityDetails, entityName) => {
            const folderName = entityDetails?.get(
                schemaEntityKey.FILE_FOLDER_NAME
            );
            if (folderName && folderName?.length > 0) {
                const requestURL = getRequestURL(
                    dataverseOrgUrl,
                    entityDetails?.get(
                        schemaEntityKey.VSCODE_ENTITY_NAME
                    ) as string,
                    "",
                    httpMethod.GET,
                    false
                );

                requestURLs.push({
                    requestUrl: requestURL,
                    entityName: entityName,
                });
            }
        }
    );

    return requestURLs;
}
