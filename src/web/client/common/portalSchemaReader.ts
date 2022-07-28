/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { portal_schema_data } from "./portalSchema";

export function getEntitiesSchemaMap(): Map<string, Map<string, string>> {
    const entitiesMap = new Map<string, Map<string, string>>();
    for (let i = 0; i < portal_schema_data.entities.entity.length; i++) {
        const entity = portal_schema_data.entities.entity[i];
        const entitiesDetailsMap = new Map<string, string>();
        if (entity) {
            for (const [key, value] of Object.entries(entity)) {
                entitiesDetailsMap.set(key, value)
            }
        }
        entitiesMap.set(entity._name, entitiesDetailsMap)
    }
    return entitiesMap;
}

export function getDataSourcePropertiesMap(): Map<string, string> {
    const dataSourceProperties: { [key: string]: string } = portal_schema_data.entities.dataSourceProperties
    const dataSourcePropertiesMap = new Map<string, string>()
    for (const [key, value] of Object.entries(dataSourceProperties)) {
        dataSourcePropertiesMap.set(key, value)
    }
    return dataSourcePropertiesMap;
}
