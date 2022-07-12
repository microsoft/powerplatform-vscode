/* eslint-disable @typescript-eslint/no-unused-vars */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";

export function showErrorDialog(detailMessaage: string, errorString: string) {
    const options = { detail: detailMessaage, modal: true };
    vscode.window.showErrorMessage(errorString, options);
}

export function checkString(s: any) {
    if (typeof (s) !== 'string' && s !== undefined) {
        showErrorDialog("Error intializing", "Mandatory parameters cannot be null");
    }
}

export function checkMap(d: any) {
    if (d.size == 0 || d === undefined) {
        showErrorDialog("Error intializing", "query parameters cannot be null");
    }
}
