/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";
import { EXTENSION_ID, SETTINGS_EXPERIMENTAL_STORE_NAME } from "../client/constants";
import { CUSTOM_TELEMETRY_FOR_POWER_PAGES_SETTING_NAME } from "./OneDSLoggerTelemetry/telemetryConstants";

export function getSelectedCode(editor: vscode.TextEditor): string {
    if (!editor) {
        return "";
    }
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    return text.trim(); //handles empty selection
}

/**
 * Returns the start and end line numbers of the selected code in the editor.
 * @param editor The vscode TextEditor object.
 * @returns An object with start and end line numbers.
 */
export function getSelectedCodeLineRange(editor: vscode.TextEditor): { start: number, end: number } {
    if (!editor) {
        return { start: 0, end: 0 };
    }
    // Get the selection(s) in the editor
    const selection = editor.selection;

    const startLine = selection.start.line;
    const endLine = selection.end.line;

    return { start: startLine, end: endLine };
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
        placeHolder: vscode.l10n.t("Enter the environment URL"),
        prompt: vscode.l10n.t("Active auth profile is not found or has expired. To create a new auth profile, enter the environment URL.")
    });
}

export async function showProgressWithNotification<T>(title: string, task: () => Promise<T>): Promise<T> {
    return await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: title,
        cancellable: false
    }, async () => {
        return await task();
    });
}

export function getExtensionVersion(): string {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    return extension ? extension.packageJSON.version : "";
}

export function getExtensionType(): string {
    return vscode.env.uiKind === vscode.UIKind.Desktop ? "Desktop" : "Web";
}

export function openWalkthrough(extensionUri: vscode.Uri) {
    const walkthroughUri = vscode.Uri.joinPath(extensionUri, 'src', 'common', 'copilot', 'assets', 'walkthrough', 'Copilot-In-PowerPages.md');
    vscode.commands.executeCommand("markdown.showPreview", walkthroughUri);
}

export function isCustomTelemetryEnabled():boolean {
    const isCustomTelemetryEnabled = vscode.workspace
        .getConfiguration(SETTINGS_EXPERIMENTAL_STORE_NAME)
        .get(CUSTOM_TELEMETRY_FOR_POWER_PAGES_SETTING_NAME);
    return isCustomTelemetryEnabled as boolean;
}
