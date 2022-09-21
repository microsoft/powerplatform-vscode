/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { httpMethod, MULTI_ENTITY_URL_KEY, pathParamToSchema, SINGLE_ENTITY_URL_KEY } from "../common/constants";
import PowerPlatformExtensionContextManager from "../common/localStore";

export const getParameterizedRequestUrlTemplate = (isSingleEntity: boolean) => {
    const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    if (isSingleEntity) {
        return powerPlatformContext.dataSourcePropertiesMap.get(SINGLE_ENTITY_URL_KEY) as string;
    }

    return powerPlatformContext.dataSourcePropertiesMap.get(MULTI_ENTITY_URL_KEY) as string;
};

export function getRequestURL(dataverseOrgUrl: string, entity: string, entityId: string, method: string, isSingleEntity: boolean): string {
    const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    let parameterizedUrlTemplate = getParameterizedRequestUrlTemplate(isSingleEntity);
    switch (method) {
        case httpMethod.GET:
            parameterizedUrlTemplate = parameterizedUrlTemplate
                + powerPlatformContext.entitiesSchemaMap.get(pathParamToSchema.get(entity) as string)?.get('_fetchQueryParameters');
            break;
        default:
            break;
    }

    return parameterizedUrlTemplate.replace('{dataverseOrgUrl}', dataverseOrgUrl).replace('{entity}', entity)
        .replace('{entityId}', entityId).replace('{api}', powerPlatformContext.dataSourcePropertiesMap.get('api') as string)
        .replace('{data}', powerPlatformContext.dataSourcePropertiesMap.get('data') as string)
        .replace('{version}', powerPlatformContext.dataSourcePropertiesMap.get('version') as string);
}

// TODO - Make Json for different response type and update any here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateEntityId(entity: string, entityId: string, result: any) {
    const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();

    const mappedEntityId = powerPlatformContext.entitiesSchemaMap.get(pathParamToSchema.get(entity) as string)?.get('_mappingEntityId');

    if (mappedEntityId) {
        return result[mappedEntityId];
    }

    return entityId;
}



export function PathHasEntityFolderName(uri: string): boolean {
    const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    console.log("powerpagedebug PathHasEntityFolderName", uri, powerPlatformContext.entitiesFolderNameMap.size);

    powerPlatformContext.entitiesFolderNameMap.forEach((value) => {
        console.log("powerpagedebug PathHasEntityFolderName inside for", value);
        if (uri.includes(value)) {
            console.log("powerpagedebug PathHasEntityFolderName valid value");
            return true;
        }
    })

    for (const entry of powerPlatformContext.entitiesFolderNameMap.entries()) {
        console.log("powerpagedebug PathHasEntityFolderName inside for", entry[1]);
        if (uri.includes(entry[1])) {
            console.log("powerpagedebug PathHasEntityFolderName valid value");
            return true;
        }
    }

    console.log("powerpagedebug PathHasEntityFolderName end");

    return false;
}
