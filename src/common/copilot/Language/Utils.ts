/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { RequestInit } from "node-fetch";
import { findWebsiteYAML, parseYAMLAndFetchKey } from "../../utilities/Utils";
import { fetchJsonResponse, getCommonHeaders } from "../../services/AuthenticationProvider";
import { sendTelemetryEvent } from "../telemetry/copilotTelemetry";
import { CopilotGetLanguageCodeFailureEvent, CopilotGetLanguageCodeSuccessEvent } from "../telemetry/telemetryConstants";
import { ADX_LANGUAGECODE, ADX_WEBSITE_LANGUAGE } from "../constants";
import { ITelemetry } from "../../../client/telemetry/ITelemetry";
import { getDefaultLanguageCodeWeb } from "../../../web/client/utilities/fileAndEntityUtil";

declare const IS_DESKTOP: string | undefined;

export async function getDefaultLanguageCode(orgUrl:string, telemetry: ITelemetry, sessionID: string, dataverseToken: string) {
    let defaultPortalLanguageCode = vscode.env.language;
    if (IS_DESKTOP) {
        const lcid = await fetchLanguageCodeId();
        defaultPortalLanguageCode = await fetchLanguageCodeFromAPI(orgUrl, dataverseToken, telemetry, sessionID, lcid);
    } else {
        defaultPortalLanguageCode = getDefaultLanguageCodeWeb();
    }
    return defaultPortalLanguageCode;
}

export async function readWebsiteYAML(filePath: string): Promise<string | null> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(
        vscode.Uri.file(filePath)
    );

    if (workspaceFolder) {
        const workspaceFolderPath = workspaceFolder.uri.fsPath;
        return await findWebsiteYAML(filePath, workspaceFolderPath);
    }

    return null;
}

export async function fetchLanguageCodeId(): Promise<string> {
    try {
        let activeFilePath = "";
        if (vscode.window.activeTextEditor) {
            activeFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
        } else if (vscode.workspace.workspaceFolders?.length === 1) {
            activeFilePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            // Handle multiple workspace folders when no active text editor is present
            return "";
        }

        const yamlContent = await readWebsiteYAML(activeFilePath);
        if (yamlContent) {
            const languageCodeId = parseYAMLAndFetchKey(yamlContent, ADX_WEBSITE_LANGUAGE);
            return languageCodeId;
        } else {
            return "";
        }
    } catch (error) {
        return "";
    }
}

export async function fetchLanguageCodeFromAPI(
    orgUrl: string,
    apiToken: string,
    telemetry: ITelemetry,
    sessionID: string,
    lcid: string
): Promise<string> {
    try {
        const dataverseApiUrl = `${
            orgUrl.endsWith("/") ? orgUrl : orgUrl.concat("/")
        }api/data/v9.2/adx_portallanguages`;

        const requestOptions: RequestInit = {
            method: "GET",
            headers: getCommonHeaders(apiToken),
        };

        const startTime = performance.now();
        const portalLanguagesResponse = await fetchJsonResponse(
            dataverseApiUrl,
            requestOptions
        );
        const endTime = performance.now();
        const responseTime = endTime - startTime || 0;

        const matchingLanguage = portalLanguagesResponse.value.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (language: any) => language.adx_lcid === parseInt(lcid, 10)
        );

        sendTelemetryEvent(telemetry, {
            eventName: CopilotGetLanguageCodeSuccessEvent,
            copilotSessionId: sessionID,
            durationInMills: responseTime,
            orgUrl: orgUrl,
        });

        return matchingLanguage?.[ADX_LANGUAGECODE] ?? vscode.env.language;
    } catch (error) {
        sendTelemetryEvent(telemetry, {
            eventName: CopilotGetLanguageCodeFailureEvent,
            copilotSessionId: sessionID,
            error: error as Error,
            orgUrl: orgUrl,
        });
        return vscode.env.language;
    }
}
