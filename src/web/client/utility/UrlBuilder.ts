/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { httpMethod, MULTI_ENTITY_URL_KEY, pathParamToSchema, SINGLE_ENTITY_URL_KEY } from "../common/constants";
import { dataSourcePropertiesMap } from "../common/localStore";

export const getParameterizedRequestUrlTemplate = (isSingleEntity: boolean) => {
    if (isSingleEntity) {
        return dataSourcePropertiesMap.get(SINGLE_ENTITY_URL_KEY) as string;
    }

    return dataSourcePropertiesMap.get(MULTI_ENTITY_URL_KEY) as string;
};

export function getRequestURL(dataverseOrgUrl: string, entity: string, entityId: string, entitiesSchemaMap: Map<string, Map<string, string>>, method: string, isSingleEntity: boolean): string {
    let parameterizedUrlTemplate = getParameterizedRequestUrlTemplate(isSingleEntity);
    switch (method) {
        case httpMethod.GET:
            parameterizedUrlTemplate = parameterizedUrlTemplate
                + entitiesSchemaMap.get(pathParamToSchema.get(entity) as string)?.get('_fetchQueryParameters');
            break;
        default:
            break;
    }

    return parameterizedUrlTemplate.replace('{dataverseOrgUrl}', dataverseOrgUrl).replace('{entity}', entity)
        .replace('{entityId}', entityId).replace('{api}', dataSourcePropertiesMap.get('api') as string)
        .replace('{data}', dataSourcePropertiesMap.get('data') as string)
        .replace('{version}', dataSourcePropertiesMap.get('version') as string);
}

// TODO - Make Json for different response type and update any here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateEntityId(entity: string, entityId: string, entitiesSchemaMap: Map<string, Map<string, string>>, result: any) {
    const mappedEntityId = entitiesSchemaMap.get(pathParamToSchema.get(entity) as string)?.get('_mappingEntityId');

    if (mappedEntityId) {
        return result[mappedEntityId];
    }

    return entityId;
}
