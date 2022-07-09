/* eslint-disable @typescript-eslint/no-unused-vars */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';
import * as vscode from "vscode";

export function showErrorDialog(detailMessaage: string, errorString: string) {
    const options = { detail: detailMessaage, modal: true };
    vscode.window.showErrorMessage(errorString, options);
}
