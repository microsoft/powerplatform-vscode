/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { getHeader, getRequestURLForSingleEntity } from './authenticationProvider';
import { columnExtension, CONTENT_PAGES, NO_CONTENT, EMPTY_FILE_NAME, DEFAULT_LANGUAGE_CODE, entityFolder, FILE_NAME_FIELD, MULTI_ENTITY_URL_KEY, ORG_URL, pathParamToSchema, WEBSITE_ID, WEBSITE_NAME } from './constants';
import { PORTALS_URI_SCHEME, SINGLE_ENTITY_URL_KEY } from './constants';
import { ERRORS, showErrorDialog } from './errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { SaveEntityDetails } from './portalSchemaInterface';
import { registerSaveProvider } from './remoteSaveProvider';
import { INFO } from './resources/Info';

/* eslint-disable @typescript-eslint/no-explicit-any */
let saveDataMap = new Map<string, SaveEntityDetails>();

export async function fetchData(accessToken: string, entity: string, entityId: string, queryParamsMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalFs: PortalsFS, websiteIdToLanguage: any) {
    try {
        const dataverseOrgUrl = queryParamsMap.get(ORG_URL);
        let url;
        if (entityId) {
            url = SINGLE_ENTITY_URL_KEY;
        }
        else url = MULTI_ENTITY_URL_KEY;
        const requestUrl = getRequestURLForSingleEntity(dataverseOrgUrl, entity, entityId, url, entitiesSchemaMap, 'GET');
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            vscode.window.showErrorMessage(ERRORS.BACKEND_ERROR);
            throw new Error(response.statusText);
        }
        const data = await response.json();
        if (data.value?.length >= 0) {
            for (let counter = 0; counter < data.value.length; counter++) {
                createContentFiles(data[counter], entity, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalFs, dataverseOrgUrl, accessToken, entityId, websiteIdToLanguage);
            }
        } else {
            createContentFiles(data, entity, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalFs, dataverseOrgUrl, accessToken, entityId, websiteIdToLanguage);
        }
    } catch (error) {
        if (typeof error === "string" && error.includes('Unauthorized')) {
            vscode.window.showErrorMessage(ERRORS.AUTHORIZATION_FAILED);
        } else {
            showErrorDialog(ERRORS.INVALID_ARGUMENT, ERRORS.INVALID_ARGUMENT_DESC);
        }
    }
}

function createContentFiles(result: string, entity: string, queryParamsMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalsFS: PortalsFS, dataverseOrgUrl: string, accessToken: string, entityId: string, websiteIdToLanguage: any) {
    let languageCode = DEFAULT_LANGUAGE_CODE;
    if (languageIdCodeMap?.size) {
        const lcid = websiteIdToLanguage.get(queryParamsMap.get(WEBSITE_ID))
        languageCode = languageIdCodeMap.get(lcid) ? languageIdCodeMap.get(lcid) : DEFAULT_LANGUAGE_CODE;
    }
    const attributes = entitiesSchemaMap.get(pathParamToSchema.get(entity)).get('_attributes');
    const exportType = entitiesSchemaMap.get(pathParamToSchema.get(entity)).get('_exporttype');
    const portalFolderName = queryParamsMap.get(WEBSITE_NAME);
    const subUri = entityFolder.get(entity) as string;
    if (exportType && exportType === 'SubFolders') {
        portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/`, true));
    }
    if (attributes) {
        const fileName = result[entitiesSchemaMap.get(pathParamToSchema.get(entity)).get(FILE_NAME_FIELD)] ? result[entitiesSchemaMap.get(pathParamToSchema.get(entity)).get(FILE_NAME_FIELD)].toLowerCase() : EMPTY_FILE_NAME;
        if (fileName === EMPTY_FILE_NAME) {
            showErrorDialog(ERRORS.FILE_NAME_NOT_SET, ERRORS.SERVICE_ERROR);
        }
        portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/`, true));
        portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/${entityFolder.get(CONTENT_PAGES)}/`, true));
        const attributeArray = attributes.split(',');
        let counter = 0
        for (counter; counter < attributeArray.length; counter++) {
            const value = result[attributeArray[counter]] ? result[attributeArray[counter]] : NO_CONTENT;
            saveDataMap = createVirtualFile(portalsFS, fileName, languageCode, value, columnExtension.get(attributeArray[counter]) as string, subUri, entityId, attributeArray[counter] as string, entity, portalFolderName);
        }
        vscode.window.showTextDocument(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/${entityFolder.get(CONTENT_PAGES)}/${fileName}.${languageCode}.${columnExtension.get(attributeArray[--counter]) as string}`));
    }
    registerSaveProvider(accessToken, portalsFS, dataverseOrgUrl, saveDataMap);
}

function createVirtualFile(portalsFS: PortalsFS, fileName: string, languageCode: string, data: any, portalFileExtension: string, subUri: string, entityId: string, saveDataAtribute: string, entity: string, portalFolderName: string) {
    const saveEntityDetails = new SaveEntityDetails(entityId, entity, saveDataAtribute);
    const fileUri = `${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/${entityFolder.get(CONTENT_PAGES)}/${fileName}.${languageCode}.${portalFileExtension}`;
    portalsFS.writeFile(vscode.Uri.parse(fileUri), new TextEncoder().encode(data), { create: true, overwrite: true });
    saveDataMap.set(vscode.Uri.parse(fileUri).fsPath, saveEntityDetails);
    return saveDataMap;
}

export async function getDataFromDataVerse(accessToken: string, entity: string, entityId: string, queryParamMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalFs: PortalsFS, websiteIdToLanguage: any) {
    vscode.window.showInformationMessage(INFO.FETCH_FILE);
    await fetchData(accessToken, entity, entityId, queryParamMap, entitiesSchemaMap, languageIdCodeMap, portalFs, websiteIdToLanguage);
}
