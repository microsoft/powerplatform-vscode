/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { componentTypeSchema, EXTENSION_ID, EXTENSION_NAME, IEnvInfo, IRelatedFiles, relatedFilesSchema, SETTINGS_EXPERIMENTAL_STORE_NAME, VSCODE_EXTENSION_COPILOT_CONTEXT_RELATED_FILES_FETCH_FAILED } from "../constants";
import { CUSTOM_TELEMETRY_FOR_POWER_PAGES_SETTING_NAME } from "../OneDSLoggerTelemetry/telemetryConstants";
import { COPILOT_UNAVAILABLE, DataverseEntityNameMap, EntityFieldMap, FieldTypeMap } from "../copilot/constants";
import { IActiveFileData } from "../copilot/model";
import { sendTelemetryEvent } from "../copilot/telemetry/copilotTelemetry";
import { getDisabledOrgList, getDisabledTenantList } from "../copilot/utils/copilotUtil";
import { CopilotNotAvailable, CopilotNotAvailableECSConfig } from "../copilot/telemetry/telemetryConstants";
import path from "path";
import { oneDSLoggerWrapper } from "../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { bapServiceAuthentication } from "../services/AuthenticationProvider";
import { BAP_API_VERSION, BAP_ENVIRONMENT_LIST_URL, BAP_SERVICE_ENDPOINT, ServiceEndpointCategory } from "../services/Constants";
import { VSCODE_EXTENSION_GET_ENV_LIST_SUCCESS, VSCODE_EXTENSION_GET_ENV_LIST_FAILED, VSCODE_EXTENSION_GET_BAP_ENDPOINT_UNSUPPORTED_REGION } from "../services/TelemetryConstants";
import { WorkspaceFolder } from "vscode-languageserver";
import { Progress } from "vscode";
import * as os from "os";

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
    return paragraph.replace(/\\/g, "\\\\").replace(/\$/g, "\\$");
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

export async function showProgressWithNotification<T>(title: string, task: (progress: Progress<{
    message?: string;
    increment?: number;
}>) => Promise<T>): Promise<T> {
    return await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: title,
        cancellable: false
    }, async (progress) => {
        return await task(progress);
    });
}

export function getExtensionVersion(): string {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    return extension ? extension.packageJSON.version : "";
}

export function getExtensionType(): string {
    return vscode.env.uiKind === vscode.UIKind.Desktop ? "Desktop" : "Web";
}

export function getOperatingSystem(): string {
    if (getExtensionType() === 'Web') {
        const userAgent = navigator.userAgent;

        if (userAgent.indexOf("Win") !== -1) {
            return "Windows";
        }

        if (userAgent.indexOf("Mac") !== -1) {
            return "macOS";
        }


        if (userAgent.indexOf("Linux") !== -1) {
            return "Linux";
        }

        return "Unknown OS";
    }

    const platform = os.platform();
    switch (platform) {
        case 'win32':
            return 'Windows';
        case 'darwin':
            return 'macOS';
        case 'linux':
            return 'Linux';
        default:
            return 'Unknown OS';
    }
}

export function getOperatingSystemVersion(): string {
    if (getExtensionType() === 'Web') {
        return "";
    }

    return os.release();
}

export function getOperatingSystemLabel(): string {
    if (getExtensionType() === 'Web') {
        return "";
    }

    return os.version();
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
    sessionID: string,
    tenantId?: string | undefined,
): boolean {

    if (!aibEndpoint) {
        return false;
    }
    else if (aibEndpoint === COPILOT_UNAVAILABLE) {
        sendTelemetryEvent({ eventName: CopilotNotAvailable, copilotSessionId: sessionID, orgId: orgID });
        return false;
    } else if (getDisabledOrgList()?.includes(orgID) || getDisabledTenantList()?.includes(tenantId ?? "")) { // Tenant ID not available in desktop
        sendTelemetryEvent({ eventName: CopilotNotAvailableECSConfig, copilotSessionId: sessionID, orgId: orgID });
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
export async function fetchRelatedFiles(activeFileUri: vscode.Uri, componentType: string, fieldType: string, sessionId: string): Promise<IRelatedFiles[]> {
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
        oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_COPILOT_CONTEXT_RELATED_FILES_FETCH_FAILED, message, error as Error, { sessionId: sessionId }, {});
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

export function getECSOrgLocationValue(clusterName: string, clusterNumber: string): string {
    // Find the position of the identifier in the input string
    const identifierPosition = clusterName.indexOf("il" + clusterNumber);

    // If the identifier is not found, return an empty string
    if (identifierPosition === -1) {
        return '';
    }

    // Calculate the starting position of the substring "SIN" or "SEAS" or "SFR" in the input string
    const startPosition = identifierPosition + clusterNumber.length;

    // Extract the substring "sin" from the input string
    const extractedSubstring = clusterName.substring(startPosition);

    return extractedSubstring;
}

//API call to get env list for an org
export async function getEnvList(endpointStamp: ServiceEndpointCategory | undefined): Promise<IEnvInfo[]> {
    if (!endpointStamp) {
        return [];
    }
    const envInfo: IEnvInfo[] = [];
    try {
        const bapAuthToken = await bapServiceAuthentication(true);
        const bapEndpoint = getBAPEndpoint(endpointStamp);
        const envListEndpoint = `${bapEndpoint}${BAP_ENVIRONMENT_LIST_URL.replace('{apiVersion}', BAP_API_VERSION)}`;

        const envListResponse = await fetch(envListEndpoint, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${bapAuthToken}`
            }
        });

        if (envListResponse.ok) {
            const envListJson = await envListResponse.json();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            envListJson.value.forEach((env: any) => {
                envInfo.push({
                    orgUrl: env.properties.linkedEnvironmentMetadata.instanceUrl,
                    envDisplayName: env.properties.displayName
                });
            });
            sendTelemetryEvent({ eventName: VSCODE_EXTENSION_GET_ENV_LIST_SUCCESS });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GET_ENV_LIST_SUCCESS);
        } else {
            sendTelemetryEvent({
                eventName: VSCODE_EXTENSION_GET_ENV_LIST_FAILED,
                errorMsg: envListResponse.statusText
            });
            oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_GET_ENV_LIST_FAILED, VSCODE_EXTENSION_GET_ENV_LIST_FAILED, new Error(envListResponse.statusText));
        }
    } catch (error) {
        sendTelemetryEvent({
            eventName: VSCODE_EXTENSION_GET_ENV_LIST_FAILED,
            errorMsg: (error as Error).message
        });
        oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_GET_ENV_LIST_FAILED, VSCODE_EXTENSION_GET_ENV_LIST_FAILED, error as Error);
    }
    return envInfo;
}


export function getBAPEndpoint(serviceEndpointStamp: ServiceEndpointCategory): string {
    let bapEndpoint = "";

    switch (serviceEndpointStamp) {
        case ServiceEndpointCategory.TEST:
            bapEndpoint = "https://test.api.bap.microsoft.com";
            break;
        case ServiceEndpointCategory.PREPROD:
            bapEndpoint = "https://preprod.api.bap.microsoft.com";
            break;
        case ServiceEndpointCategory.PROD:
            bapEndpoint = "https://api.bap.microsoft.com";
            break;
        // All below endpoints are not supported yet
        case ServiceEndpointCategory.DOD:
        case ServiceEndpointCategory.GCC:
        case ServiceEndpointCategory.HIGH:
        case ServiceEndpointCategory.MOONCAKE:
        default:
            sendTelemetryEvent({ eventName: VSCODE_EXTENSION_GET_BAP_ENDPOINT_UNSUPPORTED_REGION, data: serviceEndpointStamp });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GET_BAP_ENDPOINT_UNSUPPORTED_REGION, { data: serviceEndpointStamp });
            break;
    }

    return BAP_SERVICE_ENDPOINT.replace('{rootURL}', bapEndpoint)
}

export function getWorkspaceFolders(): WorkspaceFolder[] {
    return vscode.workspace.workspaceFolders?.map(
        (fl) => ({ ...fl, uri: fl.uri.fsPath } as WorkspaceFolder)
    ) || [];
}
