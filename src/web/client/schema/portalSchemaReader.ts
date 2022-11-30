/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { getPortalSchema } from "../utilities/schemaHelperUtil";
import { schemaEntityKey, schemaEntityName } from "./constants";

export function getEntitiesSchemaMap(schema: string): Map<string, Map<string, string>> {
    const entitiesMap = new Map<string, Map<string, string>>();
    const schema_data = getPortalSchema(schema);

    for (let i = 0; i < schema_data.entities.entity.length; i++) {
        const entity = schema_data.entities.entity[i];
        const entitiesDetailsMap = new Map<string, string>();
        if (entity) {
            for (const [key, value] of Object.entries(entity)) {
                entitiesDetailsMap.set(key, value as string)
            }
        }
        entitiesMap.set(entity._vscodeentityname, entitiesDetailsMap)
    }
    return entitiesMap;
}

export function getDataSourcePropertiesMap(schema: string): Map<string, string> {
    const dataSourceProperties: { [key: string]: string } = getPortalSchema(schema).entities.dataSourceProperties;
    const dataSourcePropertiesMap = new Map<string, string>();

    for (const [key, value] of Object.entries(dataSourceProperties)) {
        dataSourcePropertiesMap.set(key, value)
    }
    return dataSourcePropertiesMap;
}

export function getEntitiesFolderNameMap(entitiesSchemaMap: Map<string, Map<string, string>>): Map<string, string> {

    const entitiesFolderNameMap = new Map<string, string>();
    for (const entry of Object.entries(schemaEntityName)) {
        const folderName = entitiesSchemaMap.get(entry[1])?.get(schemaEntityKey.FILE_FOLDER_NAME);

        if (folderName) {
            entitiesFolderNameMap.set(entry[1], folderName);
        }
    }

    return entitiesFolderNameMap;
}
