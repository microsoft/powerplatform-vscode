/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from 'vscode';
import { getHeader } from './authenticationProvider';
import { ERRORS, showErrorDialog } from './errorHandler';
import { SaveEntityDetails } from './portalSchemaInterface';

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
