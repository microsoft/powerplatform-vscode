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