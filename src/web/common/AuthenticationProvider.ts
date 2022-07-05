/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as vscode from 'vscode';


export async function dataverseAuthentication(dataverseOrg: any) {
   let accessToken = '';

   // try  for the Dataverse session.
   try {
       const session = await vscode.authentication.getSession("microsoft", ["https://"+ dataverseOrg + "//.default"], { createIfNone: true });
       console.log(session.accessToken);
       accessToken = session.accessToken;
       console.log('Successfully logged in to dataverse ');
   }catch(e: any) {
       console.log(e.toString());
       vscode.window.showErrorMessage("Authentication to dataverse failed!, Please retry...");
   }
   return accessToken;
}

export function getHeader(accessToken: string) {
    return {
        authorization: "Bearer " + accessToken,
        'content-type': "application/json; charset=utf-8",
        accept: "application/json",
        'OData-MaxVersion': "4.0",
        'OData-Version': "4.0",
    };
}

export function getRequestUrl(method: string, dataverseOrg: string, api: string, data: string, version: string, entity: string, entityId: string, schemamap: any): string {
    let requestUrl = `https://${dataverseOrg}/${api}/${data}/${version}/${entity}(${entityId})`;
    switch (method) {
        case 'GET':
            requestUrl = requestUrl + schemamap['entity']['query'];
            break;
        default:
            break;
    }
    return requestUrl;
}

// this is used for website language provider
export function getRequestUrlforEntityRoot(method: string, dataverseOrg: string, api: string, data: string, version: string, entity: string, schemamap: any): string {
    let requestUrl = `https://${dataverseOrg}/${api}/${data}/${version}/${entity}`;
    switch (method) {
        case 'GET':
            requestUrl = requestUrl + schemamap['entity']['query'];
            break;
        default:
            break;
    }
    return requestUrl;
}

export function encodeAdditionalChars(fileName: string): string
{
    const encodeChars =  [" ", "\\", "/", ":", "?", "*" ];
    for (const c in encodeChars)
    {
        fileName = fileName.replace(c, '-');
    }
    return fileName.toLowerCase();
}

export function enCodeFolderName(folderName: string): string
{
    folderName = encodeAdditionalChars(folderName).toLowerCase();
    return folderName;
}

export function enCodeFileName( fileName: string): string
{
    fileName =encodeAdditionalChars(fileName).toLowerCase();
    return fileName;
}
