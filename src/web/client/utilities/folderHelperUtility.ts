/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import WebExtensionContext from "../WebExtensionContext";
import {
    httpMethod,
    queryParameters,
} from "../common/constants";
import { IEntityRequestUrl } from "../common/interfaces";
import { MultiFileSupportedEntityName, schemaEntityKey, schemaEntityName } from "../schema/constants";
import { isMultifileEnabled } from "./commonUtil";
import { getEntity } from "./schemaHelperUtil";
import { getRequestURL } from "./urlBuilderUtil";

export function getFolderSubUris(): string[] {
    const subUris: string[] = [];

    if (!isMultifileEnabled()) {
        const entityDetails = getEntity(WebExtensionContext.defaultEntityType);
        const subUri = entityDetails?.get(schemaEntityKey.FILE_FOLDER_NAME);
        return [subUri as string];
    }

    for (const entry of Object.entries(MultiFileSupportedEntityName)) {
        const entityDetails = WebExtensionContext.schemaEntitiesMap.get(entry[1]);        
        const subUri = entityDetails?.get(
            schemaEntityKey.FILE_FOLDER_NAME
        ) as string;

        subUris.push(subUri);
    }
    
    return subUris;
}

export function getRequestUrlForEntities(
    entityId: string,
    entityType: string
): IEntityRequestUrl[] {
    const entityRequestURLs: IEntityRequestUrl[] = [];
    const dataverseOrgUrl = WebExtensionContext.urlParametersMap.get(
        queryParameters.ORG_URL
    ) as string;

    if (
        !isMultifileEnabled() ||
        (entityId.length > 0 && entityType.length > 0)
    ) {
        const requestURL = getRequestURL(
            dataverseOrgUrl,
            entityType.length > 0
                ? entityType
                : WebExtensionContext.defaultEntityType,
            entityId.length > 0
                ? entityId
                : WebExtensionContext.defaultEntityId,
            httpMethod.GET
        );
        return [
            {
                requestUrl: requestURL,
                entityName: WebExtensionContext.defaultEntityType,
            },
        ];
    }

    for (const entry of Object.entries(MultiFileSupportedEntityName)) {
        const entityDetails = WebExtensionContext.schemaEntitiesMap.get(entry[1]);

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
                httpMethod.GET
            );

            entityRequestURLs.push({
                requestUrl: requestURL,
                entityName: entry[1],
            });
        }
    }

    return entityRequestURLs;
}

export function getEntityNameForExpandedEntityContent(entityName: string): string {
    if(entityName === schemaEntityName.ADVANCEDFORMS){
        return schemaEntityName.ADVANCEDFORMSTEPS;
    }

    return entityName;
}
