/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { getHeader, getRequestURLSingleEntity } from './authenticationProvider';
import { columnExtension, CONTENT_PAGES, NO_CONTENT, EMPTY_FILE_NAME, DEFAULT_LANGUAGE_CODE, entityFolder, FILE_NAME_FIELD, MULTI_ENTITY_URL_KEY, ORG_URL, pathParamToSchema, CHARSET } from './constants';
import { PORTALS_FOLDER_NAME, PORTALS_URI_SCHEME, SINGLE_ENTITY_URL_KEY } from './constants';
import { ERRORS, showErrorDialog } from './errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { SaveEntityDetails } from './portalSchemaInterface';
import { registerSaveProvider } from './remoteSaveProvider';

/* eslint-disable @typescript-eslint/no-explicit-any */
let saveDataMap = new Map<string, SaveEntityDetails>();

export async function fetchData(accessToken: string, entity: string, entityId: string, queryParamsMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalFs: PortalsFS) {
    try {
        const dataverseOrgUrl = queryParamsMap.get(ORG_URL);
        let url;
        if (entityId) {
            url = SINGLE_ENTITY_URL_KEY;
        }
        else url = MULTI_ENTITY_URL_KEY;
        const requestUrl = getRequestURLSingleEntity(dataverseOrgUrl, entity, entityId, url, entitiesSchemaMap, 'GET');
        vscode.window.showInformationMessage(requestUrl);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            vscode.window.showInformationMessage("auth failed in fetch data");
            throw new Error(response.statusText);
        }
        const data = await response.json();
        if (data.value?.length >= 0) {
            for (let counter = 0; counter < data.value.length; counter++) {
            createContentFiles(data[counter], entity, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalFs, dataverseOrgUrl, accessToken, entityId);
            }
        } else {
            createContentFiles(data, entity, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalFs, dataverseOrgUrl, accessToken, entityId);
        }
    } catch (e: any) {
        if (e.message.includes('Unauthorized')) {
            vscode.window.showErrorMessage('Failed to authenticate');
        }
    }
}

function createContentFiles(result: string, entity: string, queryParamsMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalsFS: PortalsFS, dataverseOrgUrl: string, accessToken: string, entityId: string) {
    let languageCode = DEFAULT_LANGUAGE_CODE;
    if (languageIdCodeMap?.size) {
        languageCode = languageIdCodeMap.get(queryParamsMap.get('websiteId')) ? languageIdCodeMap.get(queryParamsMap.get('websiteId')) : DEFAULT_LANGUAGE_CODE;
    }
    const attributes = entitiesSchemaMap.get(pathParamToSchema.get(entity)).get('_attributes');
    const exportType = entitiesSchemaMap.get(pathParamToSchema.get(entity)).get('_exporttype');
    const subUri = entityFolder.get(entity) as string;
    if (exportType && exportType === 'SubFolders') {
        portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${PORTALS_FOLDER_NAME}/${subUri}/`, true));
    }
    if (attributes) {
        const fileName = result[entitiesSchemaMap.get(pathParamToSchema.get(entity)).get(FILE_NAME_FIELD)] ? result[entitiesSchemaMap.get(pathParamToSchema.get(entity)).get(FILE_NAME_FIELD)].toLowerCase() : EMPTY_FILE_NAME;
        if (fileName === EMPTY_FILE_NAME) {
            showErrorDialog(ERRORS.FILE_NAME_NOT_SET, ERRORS.SERVICE_ERROR);
        }
        portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${PORTALS_FOLDER_NAME}/${subUri}/${fileName}/`, true));
        portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${PORTALS_FOLDER_NAME}/${subUri}/${fileName}/${entityFolder.get(CONTENT_PAGES)}/`, true));
        const attributeArray = attributes.split(',');
        let counter = 0
        for (counter; counter < attributeArray.length; counter++) {
            const value = result[attributeArray[counter]] ? result[attributeArray[counter]] : NO_CONTENT;
            saveDataMap = createVirtualFile(portalsFS, fileName, languageCode, value, columnExtension.get(attributeArray[counter]) as string, subUri, entityId, attributeArray[counter] as string, entity);
        }
        vscode.window.showTextDocument(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${PORTALS_FOLDER_NAME}/${subUri}/${fileName}/${entityFolder.get(CONTENT_PAGES)}/${fileName}.${languageCode}.${columnExtension.get(attributeArray[--counter]) as string}`))
    }
   registerSaveProvider(accessToken, portalsFS,dataverseOrgUrl, saveDataMap)
}



function createVirtualFile(portalsFS: PortalsFS, fileName: string, languageCode: string, data: any, portalFileExtension: string, subUri: string,entityId : string, saveDataAtribute : string, entity: string ) {
    const saveEntityDetails = new SaveEntityDetails(entityId, entity, saveDataAtribute);
    const fileUri = `${PORTALS_URI_SCHEME}:/${PORTALS_FOLDER_NAME}/${subUri}/${fileName}/${entityFolder.get(CONTENT_PAGES)}/${fileName}.${languageCode}.${portalFileExtension}`;
    portalsFS.writeFile(vscode.Uri.parse(fileUri), new TextEncoder().encode(data), { create: true, overwrite: true });
    saveDataMap.set(vscode.Uri.parse(fileUri).fsPath, saveEntityDetails);
    return saveDataMap;
}

export async function getDataFromDataVerse(accessToken: string, entity: string, entityId: string, queryParamMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalFs: PortalsFS) {
    vscode.window.showInformationMessage('Fetching data...');
    await fetchData(accessToken, entity, entityId, queryParamMap, entitiesSchemaMap, languageIdCodeMap, portalFs);
}
