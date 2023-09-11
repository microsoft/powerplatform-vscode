/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import path from "path";
import * as vscode from "vscode";
import yaml from 'yaml';
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { sendTelemetryEvent } from "./telemetry/copilotTelemetry";
import { CopilotDataverseMetadataFailureEvent, CopilotDataverseMetadataSuccessEvent, CopilotGetEntityFailureEvent, CopilotYamlParsingFailureEvent } from "./telemetry/telemetryConstants";
import { getFileLogicalEntityName } from "../../web/client/utilities/fileAndEntityUtil";

interface Attribute {
    LogicalName: string;
}

declare const IS_DESKTOP: string | undefined;

export async function getEntityColumns(entityName: string, orgUrl: string, apiToken: string, telemetry: ITelemetry, sessionID: string): Promise<string[]> {
    try {
        const dataverseURL = `${orgUrl.endsWith('/') ? orgUrl : orgUrl.concat('/')}api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')?$expand=Attributes($select=LogicalName)`;
        const requestInit: RequestInit = {
            method: "GET",
            headers: {
                'Content-Type': "application/json",
                Authorization: `Bearer ${apiToken}`,
            },
        };

        const startTime = performance.now();
        const jsonResponse = await fetchJsonResponse(dataverseURL, requestInit);
        const endTime = performance.now();
        const responseTime = endTime - startTime || 0;
        const attributes = getAttributesFromResponse(jsonResponse);

        sendTelemetryEvent(telemetry, { eventName: CopilotDataverseMetadataSuccessEvent, copilotSessionId: sessionID, durationInMills: responseTime, orgUrl: orgUrl })
        return attributes.map((attribute: Attribute) => attribute.LogicalName);

    } catch (error) {
        sendTelemetryEvent(telemetry, { eventName: CopilotDataverseMetadataFailureEvent, copilotSessionId: sessionID, error: error as Error, orgUrl: orgUrl })
        return [];
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJsonResponse(url: string, requestInit: RequestInit): Promise<any> {
    const response = await fetch(url, requestInit);

    if (!response.ok) {
        throw new Error(`Network request failed with status ${response.status}`);
    }

    return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAttributesFromResponse(jsonResponse: any): Attribute[] {
    if (jsonResponse.Attributes && Array.isArray(jsonResponse.Attributes) && jsonResponse.Attributes.length > 0) {
        return jsonResponse.Attributes;
    }

    return [];
}


export async function getEntityName(telemetry: ITelemetry, sessionID: string, dataverseEntity: string): Promise<string> {
    let entityName = '';

    try {
        const activeEditor = vscode.window.activeTextEditor;

        if (activeEditor) {
            const document = activeEditor.document;
            const absoluteFilePath = document.fileName; //"c:\\pac-portals\\downloads\\site-1---site-wiz1i\\basic-forms\\copilot-student-loan-registration-56a4\\Copilot-Student-Loan-Registration-56a4.basicform.custom_javascript.js"
            const activeFileFolderPath = path.dirname(absoluteFilePath); // "c:\\pac-portals\\downloads\\site-1---site-wiz1i\\basic-forms\\copilot-student-loan-registration-56a4"
            const activeFileName = path.basename(absoluteFilePath); //"Copilot-Student-Loan-Registration-56a4.basicform.custom_javascript.js"
            const fileNameFirstPart = activeFileName.split('.')[0]; //"Copilot-Student-Loan-Registration-56a4"

            const matchingFiles = await getMatchingFiles(activeFileFolderPath, fileNameFirstPart); // ["Copilot-Student-Loan-Registration-56a4.basicform.yml"]

            if (IS_DESKTOP && matchingFiles[0]) {
                const diskRead = await import('fs');
                const yamlFilePath = path.join(activeFileFolderPath, matchingFiles[0]);
                const yamlContent = diskRead.readFileSync(yamlFilePath, 'utf8');
                const parsedData = parseYamlContent(yamlContent, telemetry, sessionID, dataverseEntity);
                entityName = parsedData['adx_entityname'] || parsedData['adx_targetentitylogicalname'];
            } else if (!IS_DESKTOP) {
                entityName = getFileLogicalEntityName(document.uri.fsPath);
                console.log('getEntityName: IS_DESKTOP is false. Got call from webview for entity name: ', dataverseEntity, " and logical entity name: ", entityName);
            }
        }
    } catch (error) {
        sendTelemetryEvent(telemetry, { eventName: CopilotGetEntityFailureEvent, copilotSessionId: sessionID, dataverseEntity: dataverseEntity, error: error as Error });
        entityName = '';

        console.log('getEntityName: error while getting entity name: ', error);
    }

    console.log('getEntityName: returning ', dataverseEntity, " and logical entity name: ", entityName);
    return entityName;
}

async function getMatchingFiles(folderPath: string, fileNameFirstPart: string): Promise<string[]> {
    if (IS_DESKTOP) {
        const diskRead = await import('fs');
        const files = diskRead.readdirSync(folderPath);
        const pattern = new RegExp(`^${fileNameFirstPart}\\.(basicform|list|advancedformstep)\\.yml$`);
        return files.filter((fileName) => pattern.test(fileName));
    }

    return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseYamlContent(content: string, telemetry: ITelemetry, sessionID: string, dataverseEntity: string): any {
    try {
        return yaml.parse(content);
    } catch (error) {
        sendTelemetryEvent(telemetry, { eventName: CopilotYamlParsingFailureEvent, copilotSessionId: sessionID, dataverseEntity: dataverseEntity, error: error as Error });
        return {};
    }
}

