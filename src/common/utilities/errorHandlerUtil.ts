/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

export function showErrorDialog(errorString: string, detailMessage?: string) {
    const options = { detail: detailMessage, modal: true };
    vscode.window.showErrorMessage(errorString, options);
}