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
    return parts[0];
}

export function getLastThreePartsOfFileName(string: string): string[] {
    const parts: string[] = string.split('.');
    if (parts.length >= 3) {
      return parts.slice(-3);
    } else {
      return parts;
    }
  }
  
export function escapeDollarSign(paragraph: string): string {
    return paragraph.replace(/\$/g, "\\$");
}

//TODO: Take message as a parameter
export function showConnectedOrgMessage(environmentName: string, orgUrl: string) {
    vscode.window.showInformationMessage(
      vscode.l10n.t({
        message: "Power Pages Copilot is now connected to the environment: {0} : {1}",
        args: [environmentName, orgUrl],
        comment: ["{0} represents the environment name"]
      })
    );
  }

  export async function showInputBoxAndGetOrgUrl() {
    return vscode.window.showInputBox({
        placeHolder: "Enter the environment URL",
        prompt: "Active auth profile is not found or has expired. To create a new auth profile, enter the environment URL."
    });
}