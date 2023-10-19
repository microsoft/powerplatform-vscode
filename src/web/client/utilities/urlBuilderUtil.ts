/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    MIMETYPE,
    httpMethod,
    queryParameters,
} from "../common/constants";
import WebExtensionContext from "../WebExtensionContext";
import {
    SCHEMA_WEBFILE_FOLDER_NAME,
    entityAttributesWithBase64Encoding,
    schemaEntityKey,
    schemaEntityName,
    schemaKey,
} from "../schema/constants";
import { getAttributePath, getEntity, getEntityFetchQuery } from "./schemaHelperUtil";
import { getWorkSpaceName } from "./commonUtil";

export const getParameterizedRequestUrlTemplate = (
    useSingleEntityUrl: boolean
) => {
    if (useSingleEntityUrl) {
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
    useSingleEntityUrl = false,
    applyFilter = true,
    attributeQueryParameters?: string,
    mappingEntityName?: string
): string {
    let parameterizedUrlTemplate =
        getParameterizedRequestUrlTemplate(useSingleEntityUrl);

    if (applyFilter) {
        switch (method) {
            case httpMethod.GET:
                parameterizedUrlTemplate =
                    parameterizedUrlTemplate +
                    (attributeQueryParameters ??
                        getEntityFetchQuery(entity, entityId.length > 0 && entity.length > 0));
                break;
            default:
                break;
        }
    }

    return parameterizedUrlTemplate
        .replace("{dataverseOrgUrl}", dataverseOrgUrl)
        .replace(
            "{entity}",
            mappingEntityName ?? getEntity(entity)?.get(
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
        )
        .replace(
            "{websiteId}",
            WebExtensionContext.urlParametersMap.get(
                queryParameters.WEBSITE_ID
            ) as string
        )
        .replace("{entityId}", entityId);
}

export function getCustomRequestURL(
    dataverseOrgUrl: string,
    entity: string,
    urlQueryKey: string = schemaKey.MULTI_ENTITY_URL
): string {
    const parameterizedUrl =
        WebExtensionContext.schemaDataSourcePropertiesMap.get(
            urlQueryKey
        ) as string + getEntityFetchQuery(entity);

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
        )
        .replace(
            "{websiteId}",
            WebExtensionContext.urlParametersMap.get(
                queryParameters.WEBSITE_ID
            ) as string
        );

    return requestUrl;
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
export function getMappingEntityId(entity: string, result: any) {
    const mappedEntityId = getEntity(entity)?.get(
        schemaEntityKey.MAPPING_ENTITY_ID
    );

    if (mappedEntityId) {
        return result[mappedEntityId];
    }

    return null;
}

// TODO - Make Json for different response type and update any here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMappingEntityContent(entity: string, result: any, attribute: string) {
    const mappedEntity = getEntity(entity)?.get(
        schemaEntityKey.MAPPING_ENTITY
    );

    if (mappedEntity) {
        return result[attribute];
    }

    return result;
}

// TODO - Make Json for different response type and update any here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMimeType(result: any) {
    return result[MIMETYPE];
}

// TODO - Make Json for different response type and update any here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLogicalEntityName(result: any, logicalEntityName?: string) {
    let logicalEntity;

    if (logicalEntityName) {
        const attributePath = getAttributePath(logicalEntityName);
        logicalEntity = attributePath.relativePath.length > 0 ?
            JSON.parse(result[attributePath.source])[attributePath.relativePath] :
            result[attributePath.source];
    }

    return logicalEntity;
}

export function pathHasEntityFolderName(uri: string): boolean {
    for (const entry of WebExtensionContext.entitiesFolderNameMap.entries()) {
        if (uri.includes(entry[1])) {
            return true;
        }
    }

    return false;
}

export function isValidFilePath(fsPath: string): boolean {
    return WebExtensionContext.isContextSet &&
        fsPath.includes(WebExtensionContext.rootDirectory.fsPath) &&
        pathHasEntityFolderName(fsPath);
}

export function isValidDirectoryPath(fsPath: string): boolean {
    return WebExtensionContext.isContextSet &&
        fsPath.toLowerCase() === WebExtensionContext.rootDirectory.fsPath.toLowerCase();
}

export function isWebFileWithLazyLoad(fsPath: string): boolean {
    const isPreloadedContent = WebExtensionContext.fileDataMap.getFileMap.get(fsPath)
        ?.isContentLoaded;

    return WebExtensionContext.isContextSet &&
        fsPath.includes(WebExtensionContext.rootDirectory.fsPath) &&
        fsPath.includes(SCHEMA_WEBFILE_FOLDER_NAME) &&
        !isPreloadedContent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getOrCreateSharedWorkspace(config: any) {

    const createWorkspaceResponse = await fetch(
        `${config.dataverseOrgUrl}/api/data/v9.2/GetOrCreateSharedWorkspace`,
        {
            headers: {
                ...config.headers,
            },
            method: "POST",
            body: JSON.stringify({
                target: {
                    name: getWorkSpaceName(config.websiteid),
                }
            }),
        }
    );

    return await createWorkspaceResponse.json();
}
