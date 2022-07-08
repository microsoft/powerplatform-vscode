/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { portal_schema_data } from "./portalSchema";

export function readSchema() {
    // this will be reading all schema related entities like - dataSourceproperties, entities, fields, field , relationship
    return getDataSourcePropertiesMap()
}

export function getDataSourcePropertiesMap() {
    const dataSourcePropertie: { [key: string]: string } = portal_schema_data.entities.dataSourceProperties
    const dataSourcePropertieMap = new Map<string, string>()
    const keys = Object.keys(dataSourcePropertie);
    keys.forEach(key => {
        dataSourcePropertieMap.set(key, dataSourcePropertie[key] as string);
    });
    return dataSourcePropertieMap;
}
