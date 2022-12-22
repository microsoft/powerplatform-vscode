/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { getHeader } from '../common/authenticationProvider';
import { BAD_REQUEST, MIMETYPE } from '../common/constants';
import { showErrorDialog } from '../common/errorHandler';
import { SaveEntityDetails } from '../schema/portalSchemaInterface';
import { httpMethod } from '../common/constants';
import * as nls from 'vscode-nls';
import { getAttributePath, IAttributePath, isWebFileV2OctetStream } from '../utilities/schemaHelperUtil';
import { getPatchRequestUrl } from '../utilities/urlBuilderUtil';
import WebExtensionContext from "../powerPlatformExtensionContext";
import { telemetryEventNames } from '../telemetry/constants';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

interface ISaveCallParameters {
    requestInit: RequestInit,
    requestUrl: string
}

export async function saveData(
    accessToken: string,
    requestUrl: string,
    fileUri: vscode.Uri,
    saveDataMap: Map<string, SaveEntityDetails>,
    newFileContent: string
) {
    const saveCallParameters: ISaveCallParameters = await getSaveParameters(accessToken,
        requestUrl,
        fileUri,
        saveDataMap,
        newFileContent,
        saveDataMap.get(fileUri.fsPath)?.getSaveAttributePath);

    await saveDataToDataverse(saveDataMap,
        fileUri,
        saveCallParameters);
}

async function getSaveParameters(
    accessToken: string,
    requestUrl: string,
    fileUri: vscode.Uri,
    saveDataMap: Map<string, SaveEntityDetails>,
    newFileContent: string,
    column?: string
): Promise<ISaveCallParameters> {
    const entityName = saveDataMap.get(fileUri.fsPath)?.getEntityName as string;
    const saveCallParameters: ISaveCallParameters = {
        requestInit: {
            method: httpMethod.PATCH
        },
        requestUrl: requestUrl
    }

    if (column) {
        const attributePath: IAttributePath = getAttributePath(column);
        const data: { [k: string]: string } = {};
        const mimeType = saveDataMap.get(fileUri.fsPath)?.getMimeType;
        const isWebFileV2 = isWebFileV2OctetStream(entityName, column);

        data[attributePath.source] = await ensureLatestChanges(
            accessToken,
            attributePath,
            fileUri,
            saveDataMap,
            newFileContent,
            requestUrl);

        if (mimeType) {
            data[MIMETYPE] = mimeType
        }
        saveCallParameters.requestInit.body = isWebFileV2 ? newFileContent : JSON.stringify(data);
        saveCallParameters.requestInit.headers = getHeader(accessToken, isWebFileV2);
        saveCallParameters.requestUrl = getPatchRequestUrl(entityName, column, requestUrl);
    } else {
        WebExtensionContext.telemetry.sendAPIFailureTelemetry(requestUrl, entityName, httpMethod.PATCH, 0, BAD_REQUEST); // no API request is made in this case since we do not know in which column should we save the value
        showErrorDialog(localize("microsoft-powerapps-portals.webExtension.save.file.error", "Unable to complete the request"),
            localize("microsoft-powerapps-portals.webExtension.save.file.error.desc", "One or more attribute names have been changed or removed. Contact your admin."));
    }

    return saveCallParameters;
}

async function ensureLatestChanges(
    accessToken: string,
    attributePath: IAttributePath,
    fileUri: vscode.Uri,
    saveDataMap: Map<string, SaveEntityDetails>,
    newFileContent: string,
    requestUrl: string
) {
    if (attributePath.relativePath.length) {
        const fileAttributeContent = await getLatestContent(
            accessToken,
            attributePath,
            saveDataMap,
            fileUri,
            requestUrl,
            saveDataMap.get(fileUri.fsPath)?.getOriginalAttributeContent ?? '');

        const jsonFromOriginalContent = JSON.parse(fileAttributeContent);

        jsonFromOriginalContent[attributePath.relativePath] = newFileContent;
        return JSON.stringify(jsonFromOriginalContent);
    }
    return newFileContent;
}

async function getLatestContent(
    accessToken: string,
    attributePath: IAttributePath,
    saveDataMap: Map<string, SaveEntityDetails>,
    fileUri: vscode.Uri,
    requestUrl: string,
    originalAttributeContent: string
) {
    let fileContent: string = originalAttributeContent;
    const entityName = saveDataMap.get(fileUri.fsPath)?.getEntityName as string;
    const requestSentAtTime = new Date().getTime();
    const fileExtensionType = saveDataMap.get(fileUri.fsPath)?.getEntityFileExtensionType;
    const entityEtag = saveDataMap.get(fileUri.fsPath)?.getEntityEtag;

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
            if (result[attributePath.source]) {
                fileContent = result[attributePath.source];
            }
            WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_CHANGED);
        } else if (response.status === 304) {
            WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_ENTITY_CONTENT_SAME);
        } else {
            WebExtensionContext.telemetry.sendAPIFailureTelemetry(requestUrl,
                entityName,
                httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                JSON.stringify(response));
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

        if (typeof error === "string" && error.includes("Unauthorized")) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"),
                localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
        }
        else {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"),
                localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
        }
    }
    return fileContent;
}

async function saveDataToDataverse(
    saveDataMap: Map<string, SaveEntityDetails>,
    fileUri: vscode.Uri,
    saveCallParameters: ISaveCallParameters
) {
    if (saveCallParameters.requestInit.body) {
        const entityName = saveDataMap.get(fileUri.fsPath)?.getEntityName as string;
        const requestSentAtTime = new Date().getTime();
        const fileExtensionType = saveDataMap.get(fileUri.fsPath)?.getEntityFileExtensionType;

        try {
            WebExtensionContext.telemetry.sendAPITelemetry(saveCallParameters.requestUrl, entityName, httpMethod.PATCH, fileExtensionType);
            const response = await fetch(saveCallParameters.requestUrl, saveCallParameters.requestInit);

            if (!response.ok) {
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(saveCallParameters.requestUrl,
                    entityName,
                    httpMethod.PATCH,
                    new Date().getTime() - requestSentAtTime,
                    JSON.stringify(response));
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.backend.error", "There’s a problem on the back end"),
                    localize("microsoft-powerapps-portals.webExtension.retry.desc", "Try again"));
                throw new Error(response.statusText);
            }

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(saveCallParameters.requestUrl,
                entityName,
                httpMethod.PATCH,
                new Date().getTime() - requestSentAtTime, fileExtensionType);
        }
        catch (error) {
            const authError = (error as Error)?.message;
            WebExtensionContext.telemetry.sendAPIFailureTelemetry(saveCallParameters.requestUrl, entityName, httpMethod.PATCH, new Date().getTime() - requestSentAtTime, authError, fileExtensionType);
            if (typeof error === "string" && error.includes("Unauthorized")) {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"),
                    localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
            }
            else {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"),
                    localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
            }
            throw error;
        }
    }
}
