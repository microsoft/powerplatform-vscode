/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from 'vscode';
import { getHeader } from './authenticationProvider';
import { FILE_EXTENSION_REGEX } from './constants';

export async function saveData(accessToken: string, requestUrl: string, fileUri: vscode.Uri, entity: string, saveDataMap: any, value: string) {
    let requestBody = '';
    const fileExtensionMatch = FILE_EXTENSION_REGEX.exec(fileUri.path);
    if (fileExtensionMatch?.groups === undefined) {
        return undefined;
    }
    const field = saveDataMap.get(fileUri);
    const data = {[field] : value};
    requestBody = JSON.stringify(data);

    if (requestBody) {
        await fetch(requestUrl, {
            method: 'PATCH',
            headers: getHeader(accessToken),
            body: requestBody
        });
    }
}
