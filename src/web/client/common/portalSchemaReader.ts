/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { portal_schema_V1, portal_schema_V2 } from "./portalSchema";
import { FILE_FOLDER_NAME, NEW_SCHEMA_NAME, OLD_SCHEMA_NAME, schemaEntityName } from "./constants";

export function getEntitiesSchemaMap(schema: string): Map<string, Map<string, string>> {
    const entitiesMap = new Map<string, Map<string, string>>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let schema_data: any;
    switch (schema) {
        case OLD_SCHEMA_NAME:
            schema_data = portal_schema_V1;
            break;
        case NEW_SCHEMA_NAME:
            schema_data = portal_schema_V2;
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

export function getDataSourcePropertiesMap(schema: string): Map<string, string> {
    let dataSourceProperties: { [key: string]: string } = portal_schema_V1.entities.dataSourceProperties;
    const dataSourcePropertiesMap = new Map<string, string>();
    switch (schema) {
        case OLD_SCHEMA_NAME:
            dataSourceProperties = portal_schema_V1.entities.dataSourceProperties;
            break;
        case NEW_SCHEMA_NAME:
            dataSourceProperties = portal_schema_V2.entities.dataSourceProperties;
            break;
        default:
            break;
    }
    for (const [key, value] of Object.entries(dataSourceProperties)) {
        dataSourcePropertiesMap.set(key, value)
    }
    return dataSourcePropertiesMap;
}

export function getEntitiesFolderNameMap(entitiesSchemaMap: Map<string, Map<string, string>>): Map<string, string> {

    const entitiesFolderNameMap = new Map<string, string>();
    for (const entry of Object.entries(schemaEntityName)) {
        const folderName = entitiesSchemaMap.get(entry[1])?.get(FILE_FOLDER_NAME);

        if (folderName) {
            entitiesFolderNameMap.set(entry[1], folderName);
        }
    }

    return entitiesFolderNameMap;
}
