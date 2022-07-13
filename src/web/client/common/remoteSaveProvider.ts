/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from 'vscode';
import { getHeader } from './authenticationProvider';
import { columnExtension, FILE_EXTENSION_REGEX } from './constants';
import { ERRORS, showErrorDialog } from './errorHandler';

export async function saveData(accessToken: string, requestUrl: string, fileUri: vscode.Uri, entity: string, saveDataMap: Map<string, string>, value: string) {
    let requestBody = '';
    const fileExtensionMatch = FILE_EXTENSION_REGEX.exec(fileUri.path);
    if (fileExtensionMatch?.groups === undefined) {
        return undefined;
    }
    const field = saveDataMap.get(fileUri.fsPath);
    if (field) {
        const column = columnExtension.get(field);
        if (column) {
            const data: {[k: string]: string} = {};
            data[column] = value;
            requestBody = JSON.stringify(data);
        } else {
            showErrorDialog(ERRORS.BAD_REQUEST, ERRORS.BAD_REQUEST);
        }
    }

    if (requestBody) {
        await fetch(requestUrl, {
            method: 'PATCH',
            headers: getHeader(accessToken),
            body: requestBody
        });
    }
}
