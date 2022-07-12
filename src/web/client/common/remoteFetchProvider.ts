/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from 'vscode';
import { getHeader } from './authenticationProvider';
import { columnextensionMap, DEFAULT_CONTENT, DEFAULT_FILE_NAME, DEFAULT_LANGUAGE_CODE, entityFolderMap, FILE_NAME_FIELD, ORG_URL, pathparam_schemaMap, SINGLE_ENTITY_SAVE_URL_KEY, WEBPAGES_FILENAME } from './constants';
import { CONTENTPAGES, PORTALSFOLDERNAME, PORTALSURISCHEME, SINGLE_ENTITY_FETCH_URL_KEY } from './constants';
import { showErrorDialog } from './errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { dataSourcePropertiesMap } from './localStore';
import { saveData } from './remoteSaveProvider';

let saveDataMap = new Map<string, any>();

export async function fetchData(accessToken: string, entity: string, entityId: string, queryParamsMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalFs: PortalsFS) {
    try {
        const dataverseOrg = queryParamsMap.get(ORG_URL);
        const requestUrl = getRequestURLSingleEntity(dataverseOrg, entity, entityId, SINGLE_ENTITY_FETCH_URL_KEY, entitiesSchemaMap, 'GET');
        vscode.window.showInformationMessage(requestUrl);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            vscode.window.showInformationMessage("auth failed in fetch data");
            throw new Error(response.statusText);
        }
        const data = await response.json();
        if (data.value.length >= 0) {
            for (let counter = 0; counter < data.value.length; counter++) {
                saveDataMap = createContentFiles(data[counter], entity, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalFs);
            }
        }
        vscode.workspace.onDidSaveTextDocument(async (e) => {
            vscode.window.showInformationMessage('saving file: ' + e.uri);
            const newFileData = portalFs.readFile(e.uri);
            const patchRequestUrl = getRequestURLSingleEntity(dataverseOrg, entity, entityId, SINGLE_ENTITY_SAVE_URL_KEY, entitiesSchemaMap, 'PATCH');
            vscode.window.showInformationMessage(patchRequestUrl)
            await saveData(accessToken, patchRequestUrl, e.uri, entity, saveDataMap, new TextDecoder('utf-8').decode(newFileData));
        });

    } catch (e: any) {
        if (e.message.includes('Unauthorized')) {
            vscode.window.showErrorMessage('Failed to authenticate');
        }
    }
}

function getRequestURLSingleEntity(dataverseOrg: string, entity: string, entityId: string, urlquery: string, entitiesSchemaMap: any, method: string): string {
    const parameterizedUrl = dataSourcePropertiesMap.get(urlquery) as string;
    let requestUrl = parameterizedUrl.replace('{dataverseOrg}', dataverseOrg).replace('{entity}', entity).replace('{entityId}', entityId).replace('{api}', dataSourcePropertiesMap.get('api')).replace('{data}', dataSourcePropertiesMap.get('data')).replace('{version}', dataSourcePropertiesMap.get('version'));
    switch (method) {
        case 'GET':
            requestUrl = requestUrl + entitiesSchemaMap.get(pathparam_schemaMap.get(entity)).get('_query');
            break;
        default:
            break;
    }
    return requestUrl;
}

function createContentFiles(res: any, entity: string, queryParamsMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalsFS: PortalsFS) {
    let languageCode;
    if (languageIdCodeMap.size) {
        languageCode = languageIdCodeMap.get(queryParamsMap.get('websiteId')) ? languageIdCodeMap.get(queryParamsMap.get('websiteId')) : DEFAULT_LANGUAGE_CODE;
    }
    const attributes = entitiesSchemaMap.get(pathparam_schemaMap.get(entity)).get('_attributes');
    const fetchParam = entitiesSchemaMap.get(pathparam_schemaMap.get(entity)).get('_query').split(',');
    const exportType = entitiesSchemaMap.get(pathparam_schemaMap.get(entity)).get('_exporttype');
    const subUri = entityFolderMap.get(entity)
    if (exportType && exportType === 'SubFolders') {
        portalsFS.createDirectory(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${subUri}/`, true));

    }
    if (attributes && fetchParam) {
        for (const column in fetchParam.split(',')) {
            const value = res[column] ? res[column] : DEFAULT_CONTENT;
            const fileName = res[entitiesSchemaMap.get(pathparam_schemaMap.get(entity)).get(FILE_NAME_FIELD)] ? res[entitiesSchemaMap.get(pathparam_schemaMap.get(entity)).get(FILE_NAME_FIELD)] : DEFAULT_FILE_NAME;
            if (fileName === DEFAULT_FILE_NAME) {
                showErrorDialog("Error creating the  file, name is empty/null, creating file with default filename, please set page name", "File creation failure");
            }
            portalsFS.createDirectory(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${subUri}/${fileName}/`, true));
            portalsFS.createDirectory(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${subUri}/${fileName}/${entityFolderMap.get(CONTENTPAGES)}/`, true));
            createVirtualFile(portalsFS, fileName, languageCode, value, columnextensionMap.get(column));
        }
    }
    return saveDataMap;
}

function createVirtualFile(portalsFS: PortalsFS, fileName: string, languageCode: string, data: any, ext: any) {
    const fileuri = `${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${WEBPAGES_FILENAME}/${fileName}/${CONTENTPAGES}/${fileName}.${languageCode}.${ext}`;
    portalsFS.writeFile(vscode.Uri.parse(fileuri), new TextEncoder().encode(data), { create: true, overwrite: true });
    saveDataMap.set(fileuri, ext);
    vscode.window.showTextDocument(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${WEBPAGES_FILENAME}/${fileName}/${CONTENTPAGES}/${fileName}.${languageCode}.${ext}`))
}

export async function getDataFromDataVerse(accessToken: string, entity: string, entityId: string, queryParamMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalFs: PortalsFS) {
    vscode.window.showInformationMessage('fetching portal data...');
    await fetchData(accessToken, entity, entityId, queryParamMap, entitiesSchemaMap, languageIdCodeMap, portalFs);
}



