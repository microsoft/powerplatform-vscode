/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { sendAPIFailureTelemetry, sendAPISuccessTelemetry, sendAPITelemetry, sendErrorTelemetry } from '../telemetry/webExtensionTelemetry';
import { getHeader, getRequestURLForSingleEntity } from './authenticationProvider';
import { columnExtension, CONTENT_PAGES, NO_CONTENT, EMPTY_FILE_NAME, DEFAULT_LANGUAGE_CODE, entityFolder, FILE_NAME_FIELD, MULTI_ENTITY_URL_KEY, ORG_URL, pathParamToSchema, WEBSITE_ID, WEBSITE_NAME, telemetryEventNames } from './constants';
import { PORTALS_URI_SCHEME, SINGLE_ENTITY_URL_KEY } from './constants';
import { ERRORS, showErrorDialog } from './errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { SaveEntityDetails } from './portalSchemaInterface';
import { registerSaveProvider } from './remoteSaveProvider';
import { INFO } from './resources/Info';
let saveDataMap = new Map<string, SaveEntityDetails>();

export async function fetchData(accessToken: string, entity: string, entityId: string, queryParamsMap: Map<string, string>, entitiesSchemaMap: Map<string, Map<string, string>>, languageIdCodeMap: Map<string, string>, portalFs: PortalsFS, websiteIdToLanguage: Map<string, string>) {
    let url = '';
    let requestSentAtTime = new Date().getTime();
    try {
        const dataverseOrgUrl = queryParamsMap.get(ORG_URL) as string;
        if (entityId) {
            url = SINGLE_ENTITY_URL_KEY;
        }
        else url = MULTI_ENTITY_URL_KEY;
        const requestUrl = getRequestURLForSingleEntity(dataverseOrgUrl, entity, entityId, url, entitiesSchemaMap, 'GET');
        sendAPITelemetry(url);
        requestSentAtTime = new Date().getTime();
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            vscode.window.showErrorMessage(ERRORS.BACKEND_ERROR);
            sendAPIFailureTelemetry(url, new Date().getTime() - requestSentAtTime, response.statusText);
            throw new Error(response.statusText);
        }
        sendAPISuccessTelemetry(url, new Date().getTime() - requestSentAtTime);
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
        const authError = (error as Error)?.message;
        sendAPIFailureTelemetry(url, new Date().getTime() - requestSentAtTime, authError);
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createContentFiles(result: any, entity: string, queryParamsMap: Map<string, string>, entitiesSchemaMap: Map<string, Map<string, string>>, languageIdCodeMap: Map<string, string>, portalsFS: PortalsFS, dataverseOrgUrl: string, accessToken: string, entityId: string, websiteIdToLanguage: Map<string, string>) {
    let languageCode: string = DEFAULT_LANGUAGE_CODE;
    const lcid: string | undefined = websiteIdToLanguage.get(queryParamsMap.get(WEBSITE_ID) as string) ? websiteIdToLanguage.get(queryParamsMap.get(WEBSITE_ID) as string) : DEFAULT_LANGUAGE_CODE;
    if (languageIdCodeMap?.size && lcid) {
        languageCode = languageIdCodeMap.get(lcid) as string ? languageIdCodeMap.get(lcid) as string : DEFAULT_LANGUAGE_CODE;
    }
    const entityEntry = entitiesSchemaMap.get(pathParamToSchema.get(entity) as string);
    const attributes = entityEntry?.get('_attributes');
    const exportType = entityEntry?.get('_exporttype');
    const portalFolderName = queryParamsMap.get(WEBSITE_NAME) as string;
    const subUri = entityFolder.get(entity) as string;
    if (exportType && exportType === 'SubFolders') {
        portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/`, true));
    }
    if (attributes) {
        let fileName = EMPTY_FILE_NAME;
        const fetchedFileName = entitiesSchemaMap.get(pathParamToSchema.get(entity) as string)?.get(FILE_NAME_FIELD);
        if (fetchedFileName)
            fileName = result[fetchedFileName].toLowerCase();
        if (fileName === EMPTY_FILE_NAME) {
            showErrorDialog(ERRORS.FILE_NAME_NOT_SET, ERRORS.SERVICE_ERROR);
            sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_EMPTY_FILE_NAME);
        }
        portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/`, true));
        portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/${entityFolder.get(CONTENT_PAGES)}/`, true));
        const attributeArray = attributes.split(',');
        let counter = 0;
        for (counter; counter < attributeArray.length; counter++) {
            const value = result[attributeArray[counter]] ? result[attributeArray[counter]] : NO_CONTENT;
            saveDataMap = createVirtualFile(portalsFS, fileName, languageCode, value, columnExtension.get(attributeArray[counter]) as string, subUri, entityId, attributeArray[counter] as string, entity, portalFolderName);
        }
        vscode.window.showTextDocument(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/${entityFolder.get(CONTENT_PAGES)}/${fileName}.${languageCode}.${columnExtension.get(attributeArray[--counter]) as string}`));
    }
    registerSaveProvider(accessToken, portalsFS, dataverseOrgUrl, saveDataMap);
}

function createVirtualFile(portalsFS: PortalsFS, fileName: string, languageCode: string, data: string | undefined, portalFileExtension: string, subUri: string, entityId: string, saveDataAtribute: string, entity: string, portalFolderName: string) {
    const saveEntityDetails = new SaveEntityDetails(entityId, entity, saveDataAtribute);
    const fileUri = `${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/${entityFolder.get(CONTENT_PAGES)}/${fileName}.${languageCode}.${portalFileExtension}`;
    portalsFS.writeFile(vscode.Uri.parse(fileUri), new TextEncoder().encode(data), { create: true, overwrite: true });
    saveDataMap.set(vscode.Uri.parse(fileUri).fsPath, saveEntityDetails);
    return saveDataMap;
}

export async function getDataFromDataVerse(accessToken: string, entity: string, entityId: string, queryParamMap: Map<string, string>, entitiesSchemaMap: Map<string, Map<string, string>>, languageIdCodeMap: Map<string, string>, portalFs: PortalsFS, websiteIdToLanguage: Map<string, string>) {
    vscode.window.showInformationMessage(INFO.FETCH_FILE);
    await fetchData(accessToken, entity, entityId, queryParamMap, entitiesSchemaMap, languageIdCodeMap, portalFs, websiteIdToLanguage);
}
