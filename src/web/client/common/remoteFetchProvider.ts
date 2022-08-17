/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import {
    sendAPIFailureTelemetry,
    sendAPISuccessTelemetry,
    sendAPITelemetry,
    sendErrorTelemetry
} from '../telemetry/webExtensionTelemetry';
import { fromBase64, GetFileNameWithExtension, useBase64 } from '../utility/CommonUtility';
import {
    getRequestURL,
    updateEntityId
} from '../utility/UrlBuilder';
import { getHeader } from './authenticationProvider';
import * as Constants from './constants';
import { PORTALS_URI_SCHEME } from './constants';
import { ERRORS, showErrorDialog } from './errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { SaveEntityDetails } from './portalSchemaInterface';
import { registerSaveProvider } from './remoteSaveProvider';
import { INFO } from './resources/Info';
let saveDataMap = new Map<string, SaveEntityDetails>();

export async function fetchData(
    accessToken: string,
    entity: string,
    entityId: string,
    queryParamsMap: Map<string, string>,
    entitiesSchemaMap: Map<string, Map<string, string>>,
    languageIdCodeMap: Map<string, string>,
    portalFs: PortalsFS,
    websiteIdToLanguage: Map<string, string>
) {
    let requestUrl = '';
    let requestSentAtTime = new Date().getTime();
    try {
        const dataverseOrgUrl = queryParamsMap.get(Constants.ORG_URL) as string;

        requestUrl = getRequestURL(dataverseOrgUrl, entity, entityId, entitiesSchemaMap, Constants.httpMethod.GET, false);
        sendAPITelemetry(requestUrl);

        requestSentAtTime = new Date().getTime();
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });

        if (!response.ok) {
            vscode.window.showErrorMessage(ERRORS.BACKEND_ERROR);
            sendAPIFailureTelemetry(requestUrl, new Date().getTime() - requestSentAtTime, response.statusText);
            throw new Error(response.statusText);
        }

        sendAPISuccessTelemetry(requestUrl, new Date().getTime() - requestSentAtTime);

        const result = await response.json();
        const data = result.value;

        if (!data) {
            vscode.window.showErrorMessage(ERRORS.EMPTY_RESPONSE);
        }

        for (let counter = 0; counter < data.length; counter++) {
            createContentFiles(data[counter], entity, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalFs, dataverseOrgUrl, accessToken, entityId, websiteIdToLanguage);
        }
    } catch (error) {
        const authError = (error as Error)?.message;
        if (typeof error === "string" && error.includes('Unauthorized')) {
            vscode.window.showErrorMessage(ERRORS.AUTHORIZATION_FAILED);
        }
        else {
            vscode.window.showErrorMessage(authError);
            showErrorDialog(ERRORS.INVALID_ARGUMENT, ERRORS.INVALID_ARGUMENT_DESC);
        }

        sendAPIFailureTelemetry(requestUrl, new Date().getTime() - requestSentAtTime, authError);
    }
}

function createContentFiles(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    entity: string,
    queryParamsMap: Map<string, string>,
    entitiesSchemaMap: Map<string, Map<string, string>>,
    languageIdCodeMap: Map<string, string>,
    portalsFS: PortalsFS,
    dataverseOrgUrl: string,
    accessToken: string,
    entityId: string,
    websiteIdToLanguage: Map<string, string>
) {
    const lcid: string | undefined = websiteIdToLanguage.get(queryParamsMap.get(Constants.WEBSITE_ID) as string)
        ? websiteIdToLanguage.get(queryParamsMap.get(Constants.WEBSITE_ID) as string)
        : Constants.DEFAULT_LANGUAGE_CODE;
    const entityEntry = entitiesSchemaMap.get(Constants.pathParamToSchema.get(entity) as string);
    const attributes = entityEntry?.get('_attributes');
    const exportType = entityEntry?.get('_exporttype');
    const portalFolderName = queryParamsMap.get(Constants.WEBSITE_NAME) as string;
    const subUri = Constants.entityFolder.get(entity) as string;
    const useBase64Encoding = useBase64(entity);
    let languageCode: string = Constants.DEFAULT_LANGUAGE_CODE;

    if (languageIdCodeMap?.size && lcid) {
        languageCode = languageIdCodeMap.get(lcid) as string
            ? languageIdCodeMap.get(lcid) as string
            : Constants.DEFAULT_LANGUAGE_CODE;
    }

    let filePathInPortalFS = '';
    if (exportType && (exportType === Constants.exportType.SubFolders || exportType === Constants.exportType.SingleFolder)) {
        filePathInPortalFS = `${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/`;
        portalsFS.createDirectory(vscode.Uri.parse(filePathInPortalFS, true));
    }

    if (attributes) {
        let fileName = Constants.EMPTY_FILE_NAME;
        const fetchedFileName = entitiesSchemaMap.get(Constants.pathParamToSchema.get(entity) as string)?.get(Constants.FILE_NAME_FIELD);

        if (fetchedFileName) {
            fileName = result[fetchedFileName].toLowerCase();
        }

        if (fileName === Constants.EMPTY_FILE_NAME) {
            showErrorDialog(ERRORS.FILE_NAME_NOT_SET, ERRORS.SERVICE_ERROR);
            sendErrorTelemetry(Constants.telemetryEventNames.WEB_EXTENSION_EMPTY_FILE_NAME);
            return;
        }

        if (exportType && (exportType === Constants.exportType.SubFolders)) {
            filePathInPortalFS = `${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/`;
            portalsFS.createDirectory(vscode.Uri.parse(filePathInPortalFS, true));
        }

        const attributeArray = attributes.split(',');
        let counter = 0;

        let fileUri = '';
        for (counter; counter < attributeArray.length; counter++) {
            const value = result[attributeArray[counter]] ? result[attributeArray[counter]] : Constants.NO_CONTENT;
            const fileNameWithExtension = GetFileNameWithExtension(entity,
                fileName,
                languageCode,
                Constants.columnExtension.get(attributeArray[counter]) as string);
            fileUri = filePathInPortalFS + fileNameWithExtension;

            saveDataMap = createVirtualFile(
                portalsFS,
                fileUri,
                useBase64Encoding ? fromBase64(value) : value,
                updateEntityId(entity, entityId, entitiesSchemaMap, result),
                attributeArray[counter] as string,
                entity);
        }

        // Display only the last file
        vscode.window.showTextDocument(vscode.Uri.parse(fileUri));
    }
    registerSaveProvider(accessToken, portalsFS, dataverseOrgUrl, saveDataMap, useBase64Encoding);
}

function createVirtualFile(
    portalsFS: PortalsFS,
    fileUri: string,
    data: string | undefined,
    entityId: string,
    saveDataAtribute: string,
    entity: string
) {
    const saveEntityDetails = new SaveEntityDetails(entityId, entity, saveDataAtribute);

    portalsFS.writeFile(vscode.Uri.parse(fileUri), new TextEncoder().encode(data), { create: true, overwrite: true });
    saveDataMap.set(vscode.Uri.parse(fileUri).fsPath, saveEntityDetails);

    return saveDataMap;
}

export async function getDataFromDataVerse(accessToken: string,
    entity: string,
    entityId: string,
    queryParamMap: Map<string, string>,
    entitiesSchemaMap: Map<string, Map<string, string>>,
    languageIdCodeMap: Map<string, string>,
    portalFs: PortalsFS,
    websiteIdToLanguage: Map<string, string>
) {
    vscode.window.showInformationMessage(INFO.FETCH_FILE);
    await fetchData(accessToken, entity, entityId, queryParamMap, entitiesSchemaMap, languageIdCodeMap, portalFs, websiteIdToLanguage);
}
