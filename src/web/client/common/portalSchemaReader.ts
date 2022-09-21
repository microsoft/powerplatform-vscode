/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { portal_schema_data } from "./portalSchema";
import { FILE_FOLDER_NAME, schemaEntityName } from "./constants";

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
    const dataSourceProperties: { [key: string]: string } = portal_schema_data.entities.dataSourceProperties;
    const dataSourcePropertiesMap = new Map<string, string>();
    for (const [key, value] of Object.entries(dataSourceProperties)) {
        dataSourcePropertiesMap.set(key, value)
    }
    return dataSourcePropertiesMap;
}

export function getEntitiesFolderNameMap(entitiesSchemaMap: Map<string, Map<string, string>>): Map<string, string> {
    console.log("powerpagedebug getEntitiesFolderNameMap", Object.entries(schemaEntityName));

    const entitiesFolderNameMap = new Map<string, string>();
    for (const [key, value] of Object.entries(schemaEntityName)) {
        console.log("powerpagedebug getEntitiesFolderNameMap", value, key);
        const folderName = entitiesSchemaMap.get(value)?.get(FILE_FOLDER_NAME);
        console.log("powerpagedebug getEntitiesFolderNameMap", entitiesSchemaMap, folderName, entitiesSchemaMap.get(value));
        if (folderName) {
            console.log("powerpagedebug getEntitiesFolderNameMap: values", folderName, value);
            entitiesFolderNameMap.set(value, folderName);
            console.log("powerpagedebug getEntitiesFolderNameMap: get value", entitiesFolderNameMap.has(folderName));
        }
        console.log("powerpagedebug getEntitiesFolderNameMap: inside for", entitiesFolderNameMap.size);
    }
    console.log("powerpagedebug getEntitiesFolderNameMap: outside for", entitiesFolderNameMap.size);
    return entitiesFolderNameMap;
}


