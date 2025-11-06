/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import WebExtensionContext from "../WebExtensionContext";
import {
    httpMethod,
} from "../common/constants";
import { IEntityRequestUrl } from "../common/interfaces";
import { MultiFileSupportedEntityName, schemaEntityKey, schemaEntityName } from "../schema/constants";
import { getRequestURL } from "./urlBuilderUtil";

export function getFolderSubUris(): string[] {
    const subUris: string[] = [];

    for (const entry of Object.entries(MultiFileSupportedEntityName)) {
        const entityDetails = WebExtensionContext.schemaEntitiesMap.get(entry[1]);

        // Skip if entity is not in schema (e.g., blogs when feature flag is off)
        if (!entityDetails) {
            continue;
        }

        const subUri = entityDetails.get(
            schemaEntityKey.FILE_FOLDER_NAME
        ) as string;

        if (subUri) {
            subUris.push(subUri);
        }
    }

    return subUris;
}

export function getRequestUrlForEntities(
    entityId?: string,
    entityName?: string
): IEntityRequestUrl[] {
    const entityRequestURLs: IEntityRequestUrl[] = [];
    const dataverseOrgUrl = WebExtensionContext.orgUrl;

    if (entityId && entityName && entityId.length > 0 && entityName.length > 0) {
        entityName = entityName && entityName.length > 0
            ? entityName
            : WebExtensionContext.defaultEntityType;
        const requestURL = getRequestURL(
            dataverseOrgUrl,
            entityName,
            entityId && entityId.length > 0
                ? entityId
                : WebExtensionContext.defaultEntityId,
            httpMethod.GET
        );
        return [
            {
                requestUrl: requestURL,
                entityName: entityName,
            },
        ];
    }

    for (const entry of Object.entries(MultiFileSupportedEntityName)) {
        const entityDetails = WebExtensionContext.schemaEntitiesMap.get(entry[1]);

        // Skip if entity is not in schema (e.g., blogs when feature flag is off)
        if (!entityDetails) {
            continue;
        }

        const folderName = entityDetails.get(
            schemaEntityKey.FILE_FOLDER_NAME
        );
        if (folderName && folderName.length > 0) {
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
    if (entityName === schemaEntityName.ADVANCEDFORMS) {
        return schemaEntityName.ADVANCEDFORMSTEPS;
    }

    return entityName;
}
