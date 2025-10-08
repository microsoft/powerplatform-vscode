/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    MIMETYPE,
    httpMethod,
} from "../common/constants";
import WebExtensionContext from "../WebExtensionContext";
import {
    EntityMetadataKeyAdx,
    EntityMetadataKeyCore,
    SCHEMA_WEBFILE_FOLDER_NAME,
    SchemaEntityMetadata,
    entityAttributesWithBase64Encoding,
    schemaEntityKey,
    schemaEntityName,
    schemaKey,
} from "../schema/constants";
import { getAttributePath, getEntity, getEntityFetchQuery } from "./schemaHelperUtil";
import { getWorkSpaceName } from "./commonUtil";
import * as Constants from "../common/constants";
import { webExtensionTelemetryEventNames } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";

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
            WebExtensionContext.websiteId
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
            WebExtensionContext.websiteId
        );

    return requestUrl;
}

export function getPatchRequestUrl(
    entity: string,
    attributeType: string,
    requestUrl: string
) {
    return (entity === schemaEntityName.WEBFILES || entity === schemaEntityName.SERVERLOGICS) &&
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMetadataInfo(result: any, metadataKeys?: string[]): SchemaEntityMetadata {
    const entityMetadata: SchemaEntityMetadata = {};

    if (metadataKeys) {
        for (const key of metadataKeys) {
            const attributePath = getAttributePath(key);
            const value = attributePath.relativePath.length > 0
                ? JSON.parse(result[attributePath.source])[attributePath.relativePath]
                : result[attributePath.source];

            switch (key) {
                case EntityMetadataKeyCore.ENTITY_LOGICAL_NAME:
                case EntityMetadataKeyAdx.ENTITY_LOGICAL_NAME:
                    entityMetadata.logicalEntityName = value;
                    break;
                case EntityMetadataKeyCore.FORM_LOGICAL_NAME:
                case EntityMetadataKeyAdx.FORM_LOGICAL_NAME:
                    entityMetadata.logicalFormName = value;
                    break;
                default:
                    break;
            }
        }
    }

    return entityMetadata;
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
    let requestSentAtTime = new Date().getTime();

    const origin = config.dataverseOrgUrl;
    const apiName = Constants.GET_OR_CREATE_SHARED_WORK_SPACE;
    const requestUrl = new URL(apiName, origin);

    try {
        WebExtensionContext.telemetry.sendAPITelemetry(
            requestUrl.href,
            config.entityName,
            Constants.httpMethod.POST,
            getOrCreateSharedWorkspace.name,
        );

        requestSentAtTime = new Date().getTime();

        const createWorkspaceResponse = await WebExtensionContext.concurrencyHandler.handleRequest(
            requestUrl,
            {
                headers: {
                    ...config.headers,
                },
                method: "POST",
                body: JSON.stringify({
                    target: {
                        name: getWorkSpaceName(config.websiteId),
                    }
                }),
            }
        )

        if (!createWorkspaceResponse.ok) {
            throw new Error(JSON.stringify(createWorkspaceResponse));
        }

        WebExtensionContext.telemetry.sendAPISuccessTelemetry(
            requestUrl.href,
            config.entityName,
            Constants.httpMethod.POST,
            new Date().getTime() - requestSentAtTime,
            getOrCreateSharedWorkspace.name
        );

        return await createWorkspaceResponse.json();
    } catch (error) {
        const errorMsg = (error as Error)?.message;
        if ((error as Response)?.status > 0) {
            WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                requestUrl.href,
                config.entityName,
                Constants.httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                getOrCreateSharedWorkspace.name,
                errorMsg,
                '',
                (error as Response)?.status.toString()
            );
        } else {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_FETCH_GET_OR_CREATE_SHARED_WORK_SPACE_ERROR,
                getOrCreateSharedWorkspace.name,
                Constants.WEB_EXTENSION_FETCH_GET_OR_CREATE_SHARED_WORK_SPACE_ERROR,
                error as Error
            );
        }
    }
}
