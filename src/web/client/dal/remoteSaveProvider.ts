/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch,{RequestInit} from 'node-fetch'
import * as vscode from 'vscode';
import { getHeader } from '../common/authenticationProvider';
import { BAD_REQUEST, MIMETYPE } from '../common/constants';
import { showErrorDialog } from '../common/errorHandler';
import { FileData } from '../context/fileData';
import { httpMethod } from '../common/constants';
import * as nls from 'vscode-nls';
import { IAttributePath, isWebFileV2, useOctetStreamContentType } from '../utilities/schemaHelperUtil';
import { getPatchRequestUrl } from '../utilities/urlBuilderUtil';
import { telemetryEventNames } from '../telemetry/constants';
import WebExtensionContext from "../WebExtensionContext";
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

interface ISaveCallParameters {
    requestInit: RequestInit,
    requestUrl: string
}

export async function saveData(
    accessToken: string,
    requestUrl: string,
    fileUri: vscode.Uri
) {
    const fileDataMap = WebExtensionContext.fileDataMap.getFileMap;
    const saveCallParameters: ISaveCallParameters = await getSaveParameters(
        accessToken,
        requestUrl,
        fileUri,
        fileDataMap,
        fileDataMap.get(fileUri.fsPath)?.attributePath);

    await saveDataToDataverse(fileDataMap,
        fileUri,
        saveCallParameters);
}

async function getSaveParameters(
    accessToken: string,
    requestUrl: string,
    fileUri: vscode.Uri,
    fileDataMap: Map<string, FileData>,
    attributePath?: IAttributePath
): Promise<ISaveCallParameters> {
    const entityName = fileDataMap.get(fileUri.fsPath)?.entityName as string;
    const saveCallParameters: ISaveCallParameters = {
        requestInit: {
            method: httpMethod.PATCH
        },
        requestUrl: requestUrl
    }

    if (attributePath) {
        const webFileV2 = isWebFileV2(entityName, attributePath.source);

        saveCallParameters.requestInit.body = await getRequestBody(
            accessToken,
            requestUrl,
            fileUri,
            fileDataMap,
            attributePath,
            webFileV2);

        saveCallParameters.requestInit.headers = getHeader(accessToken, useOctetStreamContentType(entityName, attributePath.source));
        if (webFileV2) { saveCallParameters.requestInit.headers = { ...saveCallParameters.requestInit.headers, 'x-ms-file-name': fileDataMap.get(fileUri.fsPath)?.fileName as string } }

        saveCallParameters.requestUrl = getPatchRequestUrl(entityName, attributePath.source, requestUrl);
    } else {
        WebExtensionContext.telemetry.sendAPIFailureTelemetry(requestUrl, entityName, httpMethod.PATCH, 0, BAD_REQUEST); // no API request is made in this case since we do not know in which column should we save the value
        showErrorDialog(localize("microsoft-powerapps-portals.webExtension.save.file.error", "Unable to complete the request"),
            localize("microsoft-powerapps-portals.webExtension.save.file.error.desc", "One or more attribute names have been changed or removed. Contact your admin."));
    }

    return saveCallParameters;
}

async function getRequestBody(
    accessToken: string,
    requestUrl: string,
    fileUri: vscode.Uri,
    fileDataMap: Map<string, FileData>,
    attributePath: IAttributePath,
    isWebFileV2: boolean
) {
    const data: { [k: string]: string } = {};
    const mimeType = fileDataMap.get(fileUri.fsPath)?.mimeType;

    const entityColumnContent = await getLatestContent(
        accessToken,
        attributePath,
        fileDataMap,
        fileUri,
        requestUrl);

    if (!isWebFileV2) {
        data[attributePath.source] = entityColumnContent;
        if (mimeType) {
            data[MIMETYPE] = mimeType
        }
        return JSON.stringify(data);
    }

    return entityColumnContent;
}

async function getLatestContent(
    accessToken: string,
    attributePath: IAttributePath,
    fileDataMap: Map<string, FileData>,
    fileUri: vscode.Uri,
    requestUrl: string
) {
    const entityName = fileDataMap.get(fileUri.fsPath)?.entityName as string;
    const entityId = fileDataMap.get(fileUri.fsPath)?.entityId as string;
    const requestSentAtTime = new Date().getTime();
    const fileExtensionType = fileDataMap.get(fileUri.fsPath)?.entityFileExtensionType;
    const entityEtag = fileDataMap.get(fileUri.fsPath)?.entityEtag;

    const entityColumnContent: string = WebExtensionContext.entityDataMap.getColumnContent(entityId, attributePath.source);
    try {
        const requestInit: RequestInit = {
            method: httpMethod.GET,
            headers: getHeader(accessToken)
        }

        if (entityEtag) {
            requestInit.headers = {
                ...requestInit.headers,
                'If-None-Match': entityEtag
            }
        }

        WebExtensionContext.telemetry.sendAPITelemetry(requestUrl,
            entityName,
            httpMethod.GET,
            fileExtensionType);

        const response = await fetch(requestUrl, requestInit);
        
        if (response.ok) {
            const result = await response.json();
            if (result[attributePath.source] && entityColumnContent != result[attributePath.source]) {
                // TODO - use this part for showing diff to user on changed values
                // Compare the returned value with current updated content value
                // This value will be in (result[attributePath.source])[attributePath.relativePath] -
                // - in case of new data model webpages content
                // entityColumnContent = result[attributePath.source];
                // TODO - update entity etag value to latest here
            }
            WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_CHANGED);
        } else if (response.status === 304) {
            WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_SAME);
        } else {
            throw new Error(response.statusText);
        }

        WebExtensionContext.telemetry.sendAPISuccessTelemetry(requestUrl,
            entityName,
            httpMethod.GET,
            new Date().getTime() - requestSentAtTime, fileExtensionType);
    }
    catch (error) {
        const authError = (error as Error)?.message;
        WebExtensionContext.telemetry.sendAPIFailureTelemetry(requestUrl,
            entityName,
            httpMethod.GET,
            new Date().getTime() - requestSentAtTime,
            authError,
            fileExtensionType);
    }
    return entityColumnContent;
}

async function saveDataToDataverse(
    fileDataMap: Map<string, FileData>,
    fileUri: vscode.Uri,
    saveCallParameters: ISaveCallParameters
) {
    console.log("bidisha data editor-->"+vscode.workspace)
    if (saveCallParameters.requestInit.body) {
        const entityName = fileDataMap.get(fileUri.fsPath)?.entityName as string;
        const requestSentAtTime = new Date().getTime();
        const fileExtensionType = fileDataMap.get(fileUri.fsPath)?.entityFileExtensionType;

        try {
            WebExtensionContext.telemetry.sendAPITelemetry(saveCallParameters.requestUrl, entityName, httpMethod.PATCH, fileExtensionType);
            const response = await fetch(saveCallParameters.requestUrl, saveCallParameters.requestInit);

            if (!response.ok) {
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(saveCallParameters.requestUrl,
                    entityName,
                    httpMethod.PATCH,
                    new Date().getTime() - requestSentAtTime,
                    JSON.stringify(response));
                throw new Error(response.statusText);
            }

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(saveCallParameters.requestUrl,
                entityName,
                httpMethod.PATCH,
                new Date().getTime() - requestSentAtTime, fileExtensionType);

            WebExtensionContext.fileDataMap
                .updateDirtyChanges(fileUri.fsPath, false);
                console.log("bidisha data editor-->"+vscode.workspace)
        }
        catch (error) {
            const authError = (error as Error)?.message;
            WebExtensionContext.telemetry.sendAPIFailureTelemetry(saveCallParameters.requestUrl, entityName, httpMethod.PATCH, new Date().getTime() - requestSentAtTime, authError, fileExtensionType);
            if (typeof error === "string" && error.includes("Unauthorized")) {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"),
                    localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
            }
            else {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.backend.error", "There’s a problem on the back end"),
                    localize("microsoft-powerapps-portals.webExtension.retry.desc", "Try again"));
            }
            throw error;
        }
    }
}
