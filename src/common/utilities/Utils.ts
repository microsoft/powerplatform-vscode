/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { componentTypeSchema, COPILOT_RELATED_FILES_FETCH_FAILED, EXTENSION_ID, EXTENSION_NAME, IRelatedFiles, relatedFilesSchema, SETTINGS_EXPERIMENTAL_STORE_NAME } from "../constants";
import { CUSTOM_TELEMETRY_FOR_POWER_PAGES_SETTING_NAME } from "../OneDSLoggerTelemetry/telemetryConstants";
import { COPILOT_UNAVAILABLE, DataverseEntityNameMap, EntityFieldMap, FieldTypeMap } from "../copilot/constants";
import { IActiveFileData } from "../copilot/model";
import { ITelemetry } from "../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { sendTelemetryEvent } from "../copilot/telemetry/copilotTelemetry";
import { getDisabledOrgList, getDisabledTenantList } from "../copilot/utils/copilotUtil";
import { CopilotNotAvailable, CopilotNotAvailableECSConfig } from "../copilot/telemetry/telemetryConstants";
import path from "path";

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
        prompt: vscode.l10n.t("Active auth profile is not found or has expired. To create a new auth profile, enter the environment URL."),
        ignoreFocusOut: true
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

export function isCustomTelemetryEnabled(): boolean {
    const isCustomTelemetryEnabled = vscode.workspace
        .getConfiguration(SETTINGS_EXPERIMENTAL_STORE_NAME)
        .get(CUSTOM_TELEMETRY_FOR_POWER_PAGES_SETTING_NAME);
    return isCustomTelemetryEnabled as boolean;
}

export function getUserAgent(): string {
    const userAgent = "{product}/{product-version} {comment}";

    return userAgent
        .replace("{product}", EXTENSION_NAME)
        .replace("{product-version}", getExtensionVersion())
        .replace("{comment}", "(" + getExtensionType() + '; )');
}

export function getActiveEditorContent(): IActiveFileData {
    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
        return { activeFileContent: '', startLine: 0, endLine: 0, activeFileUri: undefined, activeFileParams: { dataverseEntity: '', entityField: '', fieldType: '' } };
    }

    const document = activeEditor.document,
        fileName = document.fileName,
        relativeFileName = vscode.workspace.asRelativePath(fileName),
        activeFileUri = document.uri,
        activeFileParams: string[] = getLastThreePartsOfFileName(relativeFileName),
        selectedCode = getSelectedCode(activeEditor),
        selectedCodeLineRange = getSelectedCodeLineRange(activeEditor);

    let activeFileContent = document.getText(),
        startLine = 0,
        endLine = document.lineCount;

    if (selectedCode.length > 0) {
        activeFileContent = selectedCode;
        startLine = selectedCodeLineRange.start;
        endLine = selectedCodeLineRange.end;
    }
    /**
     * Uncomment the below code to pass the visible code to the copilot based on the token limit.
     */
    //else if (document.getText().length > 100) { // Define the token limit for context passing
    //     const { code, startLine: visibleStart, endLine: visibleEnd } = getVisibleCode(activeEditor);
    //     activeFileContent = code;
    //     startLine = visibleStart;
    //     endLine = visibleEnd;
    // }

    return {
        activeFileContent,
        startLine,
        endLine,
        activeFileUri,
        activeFileParams: {
            dataverseEntity: DataverseEntityNameMap.get(activeFileParams[0]) || "",
            entityField: EntityFieldMap.get(activeFileParams[1]) || "",
            fieldType: FieldTypeMap.get(activeFileParams[2]) || ""
        }
    };
}

export function checkCopilotAvailability(
    aibEndpoint: string | null,
    orgID: string,
    telemetry: ITelemetry,
    sessionID: string,
    tenantId?: string | undefined,
): boolean {

    if (!aibEndpoint) {
        return false;
    }
    else if (aibEndpoint === COPILOT_UNAVAILABLE) {
        sendTelemetryEvent(telemetry, { eventName: CopilotNotAvailable, copilotSessionId: sessionID, orgId: orgID });
        return false;
    } else if (getDisabledOrgList()?.includes(orgID) || getDisabledTenantList()?.includes(tenantId ?? "")) { // Tenant ID not available in desktop
        sendTelemetryEvent(telemetry, { eventName: CopilotNotAvailableECSConfig, copilotSessionId: sessionID, orgId: orgID });
        return false;
    } else {
        return true;
    }
}

export function getVisibleCode(editor: vscode.TextEditor): { code: string; startLine: number; endLine: number; } {
    const visibleRanges = editor.visibleRanges;
    const visibleCode = visibleRanges.map(range => editor.document.getText(range)).join('\n');
    const firstVisibleRange = visibleRanges[0];
    return {
        code: visibleCode,
        startLine: firstVisibleRange.start.line,
        endLine: firstVisibleRange.end.line
    };
}


async function getFileContent(activeFileUri: vscode.Uri, customExtension: string): Promise<{ customFileContent: string; customFileName: string; }> {
    try {
        const activeFileFolderPath = getFolderPathFromUri(activeFileUri);
        const activeFileName = getFileNameFromUri(activeFileUri);

        const activeFileNameParts = activeFileName.split('.');

        let customFileName = activeFileNameParts[0];

        for (let i = 1; i < activeFileNameParts.length - 2; i++) {
            customFileName += `.${activeFileNameParts[i]}`;
        }

        customFileName += customExtension;

        const customFilePath = path.join(activeFileFolderPath, customFileName);

        // Read the content of the custom file
        const diskRead = await import('fs');
        const customFileContent = diskRead.readFileSync(customFilePath, 'utf8');

        return { customFileContent, customFileName };
    } catch (error) {
        throw new Error(`Error reading the custom file content: ${error}`);
    }
}

// Generic function to get file content based on type and component type
async function getFileContentByType(activeFileUri: vscode.Uri, componentType: string, fileType: string): Promise<{ customFileContent: string; customFileName: string; }> {
    try {
        const extension = componentTypeSchema[componentType]?.[fileType];
        if (!extension) {
            throw new Error(`File type ${fileType} not found for component type ${componentType}`);
        }
        return await getFileContent(activeFileUri, extension);
    } catch (error) {
        const message = (error as Error)?.message;
        throw new Error(message);
    }
}

//fetchRelatedFiles function based on component type
export async function fetchRelatedFiles(activeFileUri: vscode.Uri, componentType: string, fieldType: string, telemetry: ITelemetry, sessionId:string): Promise<IRelatedFiles[]> {
    try {
        const relatedFileTypes = relatedFilesSchema[componentType]?.[fieldType];
        if (!relatedFileTypes) {
            return [];
        }

        const files: IRelatedFiles[] = await Promise.all(
            relatedFileTypes.map(async fileType => {
                const fileContentResult = await getFileContentByType(activeFileUri, componentType, fileType);
                return {
                    fileType,
                    fileContent: fileContentResult.customFileContent,
                    fileName: fileContentResult.customFileName
                };
            })
        );

        return files;
    } catch (error) {
        const message = (error as Error)?.message;
        telemetry.sendTelemetryErrorEvent(COPILOT_RELATED_FILES_FETCH_FAILED, { error: message, sessionId: sessionId });
        return [];
    }
}

export function getFilePathFromUri(uri: vscode.Uri): string {
    return uri.fsPath;
}

export function getFileNameFromUri(uri: vscode.Uri): string {
    return path.basename(uri.fsPath);
}

export function getFolderPathFromUri(uri: vscode.Uri): string {
    return path.dirname(uri.fsPath);
}
