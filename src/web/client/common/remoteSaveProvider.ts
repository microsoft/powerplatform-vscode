/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { sendAPIFailureTelemetry, sendAPITelemetry } from '../telemetry/webExtensionTelemetry';
import { toBase64 } from '../utility/CommonUtility';
import { getRequestURL } from '../utility/UrlBuilder';
import { getHeader } from './authenticationProvider';
import { BAD_REQUEST, CHARSET, httpMethod } from './constants';
import { ERRORS, showErrorDialog } from './errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { entitiesSchemaMap } from './localStore';
import { SaveEntityDetails } from './portalSchemaInterface';
import { INFO } from './resources/Info';

export function registerSaveProvider(
    accessToken: string,
    portalsFS: PortalsFS,
    dataVerseOrgUrl: string,
    saveDataMap: Map<string, SaveEntityDetails>,
    useBase64Encoding: boolean
) {
    vscode.workspace.onDidSaveTextDocument(async (e) => {
        vscode.window.showInformationMessage(INFO.SAVE_FILE);

        const newFileData = portalsFS.readFile(e.uri);
        let stringDecodedValue = new TextDecoder(CHARSET).decode(newFileData);

        if (useBase64Encoding) {
            stringDecodedValue = toBase64(stringDecodedValue);
        }

        const patchRequestUrl = getRequestURL(dataVerseOrgUrl,
            saveDataMap.get(e.uri.fsPath)?.getEntityName as string,
            saveDataMap.get(e.uri.fsPath)?.getEntityId as string,
            entitiesSchemaMap,
            httpMethod.PATCH,
            true);

        await saveData(accessToken, patchRequestUrl, e.uri, saveDataMap, stringDecodedValue);
    });
}

export async function saveData(
    accessToken: string,
    requestUrl: string,
    fileUri: vscode.Uri,
    saveDataMap: Map<string, SaveEntityDetails>,
    value: string
) {
    let requestBody = '';
    const column = saveDataMap.get(fileUri.fsPath)?.getSaveAttribute;

    if (column) {
        const data: { [k: string]: string } = {};
        data[column] = value;
        requestBody = JSON.stringify(data);
    } else {
        sendAPIFailureTelemetry(requestUrl, 0, BAD_REQUEST); // no API request is made in this case since we do not know in which column should we save the value
        showErrorDialog(ERRORS.BAD_REQUEST, ERRORS.BAD_REQUEST_DESC);
    }

    if (requestBody) {
        const requestSentAtTime = new Date().getTime();
        try {
            const response = await fetch(requestUrl, {
                method: 'PATCH',
                headers: getHeader(accessToken),
                body: requestBody
            });

            sendAPITelemetry(requestUrl);

            if (!response.ok) {
                sendAPIFailureTelemetry(requestUrl, new Date().getTime() - requestSentAtTime, response.statusText);
                vscode.window.showErrorMessage(ERRORS.BACKEND_ERROR);
                throw new Error(response.statusText);
            }
        }
        catch (error) {
            const authError = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, new Date().getTime() - requestSentAtTime, authError);

            if (typeof error === "string" && error.includes('Unauthorized')) {
                vscode.window.showErrorMessage(ERRORS.AUTHORIZATION_FAILED);
            } else {
                showErrorDialog(ERRORS.INVALID_ARGUMENT, ERRORS.INVALID_ARGUMENT_DESC);
            }
        }
    }
}
