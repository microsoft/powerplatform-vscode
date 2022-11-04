/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { httpMethod, schemaEntityKey, schemaKey } from "../common/constants";
import PowerPlatformExtensionContextManager from "../common/localStore";
import { getEntity } from "./schemaHelper";

export const getParameterizedRequestUrlTemplate = (isSingleEntity: boolean) => {
    const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    if (isSingleEntity) {
        return powerPlatformContext.dataSourcePropertiesMap.get(schemaKey.SINGLE_ENTITY_URL) as string;
    }

    return powerPlatformContext.dataSourcePropertiesMap.get(schemaKey.MULTI_ENTITY_URL) as string;
};

export function getRequestURL(dataverseOrgUrl: string, entity: string, entityId: string, method: string, isSingleEntity: boolean): string {
    const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    let parameterizedUrlTemplate = getParameterizedRequestUrlTemplate(isSingleEntity);
    console.log("remoteFetchProvider getRequestURL parameterizedUrlTemplate", parameterizedUrlTemplate);
    switch (method) {
        case httpMethod.GET:
            parameterizedUrlTemplate = parameterizedUrlTemplate
                + getEntity(entity)?.get(schemaEntityKey.FETCH_QUERY_PARAMETERS);
            break;
        default:
            break;
    }

    return parameterizedUrlTemplate.replace('{dataverseOrgUrl}', dataverseOrgUrl).replace('{entity}', getEntity(entity)?.get(schemaEntityKey.DATAVERSE_ENTITY_NAME) as string)
        .replace('{entityId}', entityId).replace('{api}', powerPlatformContext.dataSourcePropertiesMap.get(schemaKey.API) as string)
        .replace('{data}', powerPlatformContext.dataSourcePropertiesMap.get(schemaKey.DATA) as string)
        .replace('{version}', powerPlatformContext.dataSourcePropertiesMap.get(schemaKey.DATAVERSE_API_VERSION) as string);
}

export function getCustomRequestURL(dataverseOrgUrl: string, entity: string, urlQueryKey: string = schemaKey.MULTI_ENTITY_URL): string {
    const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    const parameterizedUrl = powerPlatformContext.dataSourcePropertiesMap.get(urlQueryKey) as string;
    const fetchQueryParameters = getEntity(entity)?.get("_fetchQueryParameters");
    const requestUrl = parameterizedUrl.replace('{dataverseOrgUrl}', dataverseOrgUrl)
        .replace('{entity}', getEntity(entity)?.get(schemaEntityKey.DATAVERSE_ENTITY_NAME) as string)
        .replace('{api}', powerPlatformContext.dataSourcePropertiesMap.get(schemaKey.API) as string)
        .replace('{data}', powerPlatformContext.dataSourcePropertiesMap.get(schemaKey.DATA) as string)
        .replace('{version}', powerPlatformContext.dataSourcePropertiesMap.get(schemaKey.DATAVERSE_API_VERSION) as string);

    return requestUrl + fetchQueryParameters;
}

// this function removes hostName from the url
export function sanitizeURL(url: string): string {
    let sanitizedUrl = '';
    try {
        const completeUrl = new URL(url);
        const hostName = completeUrl.hostname;
        sanitizedUrl = url.replace(hostName, '[redact]');
    } catch (error) {
        return '';
    }
    return sanitizedUrl;
}

// TODO - Make Json for different response type and update any here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateEntityId(entity: string, entityId: string, result: any) {
    const mappedEntityId = getEntity(entity)?.get(schemaEntityKey.MAPPING_ENTITY_ID);

    if (mappedEntityId) {
        return result[mappedEntityId];
    }

    return entityId;
}

export function PathHasEntityFolderName(uri: string): boolean {
    const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();

    for (const entry of powerPlatformContext.entitiesFolderNameMap.entries()) {
        if (uri.includes(entry[1])) {
            return true;
        }
    }

    return false;
}
