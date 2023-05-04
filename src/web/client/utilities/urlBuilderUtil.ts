/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { httpMethod } from "../common/constants";
import WebExtensionContext from "../WebExtensionContext";
import {
    entityAttributesWithBase64Encoding,
    schemaEntityKey,
    schemaEntityName,
    schemaKey,
} from "../schema/constants";
import { getEntity } from "./schemaHelperUtil";

export const getParameterizedRequestUrlTemplate = (isSingleEntity: boolean) => {
    if (isSingleEntity) {
        return WebExtensionContext.schemaDataSourcePropertiesMap.get(
            schemaKey.SINGLE_ENTITY_URL
        ) as string;
    }

    return WebExtensionContext.schemaDataSourcePropertiesMap.get(
        schemaKey.MULTI_ENTITY_URL
    ) as string;
};

export function getRequestURL(
    dataverseOrgUrl: string,
    entity: string,
    entityId: string,
    method: string,
    isSingleEntity: boolean,
    attributeQueryParameters?: string
): string {
    let parameterizedUrlTemplate =
        getParameterizedRequestUrlTemplate(isSingleEntity);

    if (!isSingleEntity) {
        switch (method) {
            case httpMethod.GET:
                parameterizedUrlTemplate =
                    parameterizedUrlTemplate +
                    (attributeQueryParameters ??
                        getEntity(entity)?.get(
                            schemaEntityKey.FETCH_QUERY_PARAMETERS
                        ));
                break;
            default:
                break;
        }
    }

    return parameterizedUrlTemplate
        .replace("{dataverseOrgUrl}", dataverseOrgUrl)
        .replace(
            "{entity}",
            getEntity(entity)?.get(
                schemaEntityKey.DATAVERSE_ENTITY_NAME
            ) as string
        )
        .replace("{entityId}", entityId)
        .replace(
            "{api}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.API
            ) as string
        )
        .replace(
            "{data}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.DATA
            ) as string
        )
        .replace(
            "{version}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.DATAVERSE_API_VERSION
            ) as string
        );
}

export function getCustomRequestURL(
    dataverseOrgUrl: string,
    entity: string,
    urlQueryKey: string = schemaKey.MULTI_ENTITY_URL
): string {
    const parameterizedUrl =
        WebExtensionContext.schemaDataSourcePropertiesMap.get(
            urlQueryKey
        ) as string;
    const fetchQueryParameters = getEntity(entity)?.get(
        "_fetchQueryParameters"
    );
    const requestUrl = parameterizedUrl
        .replace("{dataverseOrgUrl}", dataverseOrgUrl)
        .replace(
            "{entity}",
            getEntity(entity)?.get(
                schemaEntityKey.DATAVERSE_ENTITY_NAME
            ) as string
        )
        .replace(
            "{api}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.API
            ) as string
        )
        .replace(
            "{data}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.DATA
            ) as string
        )
        .replace(
            "{version}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.DATAVERSE_API_VERSION
            ) as string
        );

    return requestUrl + fetchQueryParameters;
}

export function getPatchRequestUrl(
    entity: string,
    attributeType: string,
    requestUrl: string
) {
    return entity === schemaEntityName.WEBFILES &&
        attributeType === entityAttributesWithBase64Encoding.filecontent
        ? requestUrl + "/" + attributeType
        : requestUrl;
}

// this function removes hostName from the url
export function sanitizeURL(url: string): string {
    let sanitizedUrl = "";
    try {
        const completeUrl = new URL(url);
        const hostName = completeUrl.hostname;
        sanitizedUrl = url.replace(hostName, "[redact]");
    } catch (error) {
        return "";
    }
    return sanitizedUrl;
}

// TODO - Make Json for different response type and update any here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateEntityId(entity: string, entityId: string, result: any) {
    const mappedEntityId = getEntity(entity)?.get(
        schemaEntityKey.MAPPING_ENTITY_ID
    );

    if (mappedEntityId) {
        return result[mappedEntityId];
    }

    return entityId;
}

export function pathHasEntityFolderName(uri: string): boolean {
    for (const entry of WebExtensionContext.entitiesFolderNameMap.entries()) {
        if (uri.includes(entry[1])) {
            return true;
        }
    }

    return false;
}
