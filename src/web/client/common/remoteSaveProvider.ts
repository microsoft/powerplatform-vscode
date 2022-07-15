/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from 'vscode';
import { getHeader, getRequestURLSingleEntity } from './authenticationProvider';
import { CHARSET, SINGLE_ENTITY_URL_KEY } from './constants';
import { ERRORS, showErrorDialog } from './errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { entitiesSchemaMap } from './localStore';
import { SaveEntityDetails } from './portalSchemaInterface';

export function registerSaveProvider(accessToken: string, portalsFS: PortalsFS, dataVerseOrgUrl: string, saveDataMap: Map<string, SaveEntityDetails>) {
    vscode.workspace.onDidSaveTextDocument(async (e) => {
        vscode.window.showInformationMessage('saving file: ' + e.uri);
        const newFileData = portalsFS.readFile(e.uri);
        const patchRequestUrl = getRequestURLSingleEntity(dataVerseOrgUrl, saveDataMap.get(e.uri.fsPath)?.getEntityName as string, saveDataMap.get(e.uri.fsPath)?.getEntityId as string, SINGLE_ENTITY_URL_KEY, entitiesSchemaMap, 'PATCH');
        vscode.window.showInformationMessage(patchRequestUrl);
        await saveData(accessToken, patchRequestUrl, e.uri, saveDataMap, new TextDecoder(CHARSET).decode(newFileData));
    });
}

export async function saveData(accessToken: string, requestUrl: string, fileUri: vscode.Uri, saveDataMap: Map<string, SaveEntityDetails>, value: string) {
    let requestBody = '';
    const column = saveDataMap.get(fileUri.fsPath)?.getSaveAttribute;
    if (column) {
        const data: { [k: string]: string } = {};
        data[column] = value;
        requestBody = JSON.stringify(data);
    } else {
        showErrorDialog(ERRORS.BAD_REQUEST, ERRORS.BAD_REQUEST);
    }

    if (requestBody) {
        await fetch(requestUrl, {
            method: 'PATCH',
            headers: getHeader(accessToken),
            body: requestBody
        });
    }
}
