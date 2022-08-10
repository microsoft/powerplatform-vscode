/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NEW_SCHEMA_NAME, OLD_SCHEMA_NAME } from "./constants";
import { portal_schema_data, portal_schema_new_data } from "./portalSchema";

export async function getEntitiesSchemaMap(schema : string): Promise<Map<string, Map<string, string>>> {
    const entitiesMap = new Map<string, Map<string, string>>();
    let schema_data : any | undefined;
    switch (schema) {
        case OLD_SCHEMA_NAME:
            schema_data = portal_schema_data;
            break;
        case NEW_SCHEMA_NAME:
            schema_data = portal_schema_new_data;
            break;
        default:
            break;
    }

    for (let i = 0; i < schema_data.entities.entity.length; i++) {
        const entity = schema_data.entities.entity[i];
        const entitiesDetailsMap = new Map<string, string>();
        if (entity) {
            for (const [key, value] of Object.entries(entity)) {
                entitiesDetailsMap.set(key, value as string)
            }
        }
        entitiesMap.set(entity._name, entitiesDetailsMap)
    }
    return entitiesMap;
}

export async function getDataSourcePropertiesMap(schema: string): Promise<Map<string, string>> {
    let dataSourceProperties: { [key: string]: string } | undefined;
    const dataSourcePropertiesMap = new Map<string, string>()
    switch (schema) {
        case OLD_SCHEMA_NAME:
            dataSourceProperties = portal_schema_data.entities.dataSourceProperties;
            break;
        case NEW_SCHEMA_NAME:
            dataSourceProperties = portal_schema_new_data.entities.dataSourceProperties;
            break;
        default:
            break;
    }
    if(dataSourceProperties){
        for (const [key, value] of Object.entries(dataSourceProperties)) {
            dataSourcePropertiesMap.set(key, value)
        }
    }
    return dataSourcePropertiesMap;
}
