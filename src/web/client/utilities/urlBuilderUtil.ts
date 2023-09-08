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
import { getEntity, getEntityFetchQuery } from "./schemaHelperUtil";

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
    const getWorkspaceResponse = await fetch(
        `${config.dataverseOrgUrl}/api/data/v9.2/sharedworkspaces`,
        {
            headers: config.headers,
            method: "GET",
        }
    );

    const getWorkspaceResult = await getWorkspaceResponse.json();

    if (getWorkspaceResult.value.length) {
        for (const workspace of await getWorkspaceResult.value) {
            if (workspace.name === `Site-${WebExtensionContext.currentSchemaVersion === "PortalSchemaV1" ? 'v1' : 'v2'}-${config.websiteid}`) {
                return workspace;
            }
        }
    }

    const createWorkspaceResponse = await fetch(
        `${config.dataverseOrgUrl}/api/data/v9.2/sharedworkspaces`,
        {
            headers: {
                ...config.headers,
                Prefer: "return=representation",
            },
            method: "POST",
            body: JSON.stringify({
                name: config.websiteid,
                sharedworkspaceid: "00218f43-15d4-f87e-0e08-5dec2c4cfbaa",
            }),
        }
    );

    return await createWorkspaceResponse.json();
}
