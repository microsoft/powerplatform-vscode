/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import { SCHEMAFILENAME, WEBPAGES } from "./Constants";
import { PortalSchemaProxy } from "./PortalSchemaInterface";

export function loadschema(): any
{
    fetch(SCHEMAFILENAME)
    .then(response => {
    return response.json();
    })
    .then(jsondata => {
    const schemaObject = PortalSchemaProxy.Parse(jsondata);
    console.log(schemaObject)
    return schemaObject;
});
}


export function CreateEntityDetailMap(result: any, schemaObject: Map<string, string>, schemamap: Map<any, any>):
Map<any, any> {

    Object.keys(schemaObject).forEach(function(key) {
        const value = schemaObject.get(key);
        console.log(value)
        switch (key) {
            case WEBPAGES:
                schemamap.set(key,JSON.parse('TEST'));
                break;
            default:
                break;
        }
    });

    return schemamap;
}

export function getfoldername(fetchQueryEntityMap: Map<any, any>, entity: string) {
    return fetchQueryEntityMap.get(entity)['_folderName'];
}

export function GetCustomDetails(schemaObject: Map<string, string>, schemamap: Map<any, any>):
    Map<any, any> {
        const value = schemaObject.get("organization");
        console.log(value)
        schemamap.set('api', schemaObject.get('api'));
        schemamap.set('data', schemaObject.get('data'))
        schemamap.set('version', schemaObject.get('version'))

        return schemamap;
}

