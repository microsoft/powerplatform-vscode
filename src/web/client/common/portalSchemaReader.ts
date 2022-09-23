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

    const entitiesFolderNameMap = new Map<string, string>();
    for (const entry of Object.entries(schemaEntityName)) {
        const folderName = entitiesSchemaMap.get(entry[1])?.get(FILE_FOLDER_NAME);

        if (folderName) {
            entitiesFolderNameMap.set(entry[1], folderName);
        }
    }

    return entitiesFolderNameMap;
}
