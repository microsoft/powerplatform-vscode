/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { portal_schema_data } from "./portalSchema";

export function readSchema() {
    return getOrganizationMap()
}

export function getSchemaMapForEntities() {
    const organizationMap = new Map<string, string>();
    for (const pair in portal_schema_data.entities.entity.entries()) {
        console.log(pair[0], "key, value", pair[1])
        organizationMap.set(pair[0], pair[1])
    }
    return organizationMap
}

export function getOrganizationMap() {
    const jsonArray : { [key: string]: string }= portal_schema_data.entities.organization[0]
    const orgMap = new Map<string, string>()
    const keys = Object.keys(jsonArray);
    keys.forEach(key=>{
    console.log(key + '|' + jsonArray[key] as string);
    orgMap.set(key, jsonArray[key] as string);
    });
    return orgMap;
}

