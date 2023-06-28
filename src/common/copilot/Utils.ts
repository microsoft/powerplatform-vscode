/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";

export function getSelectedSnippet(): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return "";
    }
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    return text;
}

// Get the organization ID from the user during login
export async function getOrgID(): Promise<string> {
    const orgID = await vscode.window.showInputBox({
        placeHolder: vscode.l10n.t("Enter Organization ID")
    });
    if (!orgID) {
        throw new Error("Organization ID is required");
    }
    return Promise.resolve(orgID);
}


export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


export function getUserName(user: string) {
    const parts = user.split(" - ");
    console.log(parts[0]);
    console.log(parts[1]);
    return parts[0];
}