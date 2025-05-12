/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import path from "path";
import * as vscode from "vscode";
import yaml from 'yaml';
import { sendTelemetryEvent } from "./telemetry/copilotTelemetry";
import { CopilotDataverseMetadataFailureEvent, CopilotDataverseMetadataSuccessEvent, CopilotGetEntityFailureEvent, CopilotYamlParsingFailureEvent } from "./telemetry/telemetryConstants";
import { getEntityMetadata } from "../../web/client/utilities/fileAndEntityUtil";
import { DOMParser } from "@xmldom/xmldom";
import { ATTRIBUTE_CLASSID, ATTRIBUTE_DATAFIELD_NAME, ATTRIBUTE_DESCRIPTION, ControlClassIdMap, SYSTEFORMS_API_PATH } from "./constants";
import { getUserAgent } from "../utilities/Utils";


declare const IS_DESKTOP: string | undefined;

export async function getEntityColumns(entityName: string, orgUrl: string, apiToken: string, sessionID: string): Promise<string[]> {
    try {
        const dataverseURL = `${orgUrl.endsWith('/') ? orgUrl : orgUrl.concat('/')}api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')?$expand=Attributes`;
        const requestInit: RequestInit = {
            method: "GET",
            headers: {
                'Content-Type': "application/json",
                Authorization: `Bearer ${apiToken}`,
                "x-ms-user-agent": getUserAgent()
            },
        };

        const startTime = performance.now();
        const jsonResponse = await fetchJsonResponse(dataverseURL, requestInit);
        const endTime = performance.now();
        const responseTime = endTime - startTime || 0;
        const attributes = getAttributesFromResponse(jsonResponse); //Display name and logical name fetching from response

        sendTelemetryEvent({ eventName: CopilotDataverseMetadataSuccessEvent, copilotSessionId: sessionID, durationInMills: responseTime, orgUrl: orgUrl })
        return attributes

    } catch (error) {
        sendTelemetryEvent({ eventName: CopilotDataverseMetadataFailureEvent, copilotSessionId: sessionID, error: error as Error, orgUrl: orgUrl })
        return [];
    }
}

export async function getFormXml(entityName: string, formName: string, orgUrl: string, apiToken: string, sessionID: string): Promise<(string[])> {
    try {
        // Ensure the orgUrl ends with a '/'
        const formattedOrgUrl = orgUrl.endsWith('/') ? orgUrl : `${orgUrl}/`;

        const queryParams = `$filter=objecttypecode eq '${entityName}' and name eq '${formName}'`;

        const dataverseURL = `${formattedOrgUrl}${SYSTEFORMS_API_PATH}?${queryParams}`;

        const requestInit: RequestInit = {
            method: "GET",
            headers: {
                'Content-Type': "application/json",
                Authorization: `Bearer ${apiToken}`,
                "x-ms-user-agent": getUserAgent()
            },
        };

        const startTime = performance.now();
        const jsonResponse = await fetchJsonResponse(dataverseURL, requestInit);
        const endTime = performance.now();
        const responseTime = endTime - startTime || 0;

        const formxml = getFormXMLFromResponse(jsonResponse);

        sendTelemetryEvent({ eventName: CopilotDataverseMetadataSuccessEvent, copilotSessionId: sessionID, durationInMills: responseTime, orgUrl: orgUrl })
        return parseXML(formxml);

    } catch (error) {
        sendTelemetryEvent({ eventName: CopilotDataverseMetadataFailureEvent, copilotSessionId: sessionID, error: error as Error, orgUrl: orgUrl })
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
function getAttributesFromResponse(jsonResponse: any): string[] {
    if (jsonResponse.Attributes && Array.isArray(jsonResponse.Attributes) && jsonResponse.Attributes.length > 0) {
        const attributes = jsonResponse.Attributes;
        const logicalNameDisplayName: string[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attributes.forEach((attr: any) => {
            const attrDisplayName = attr.DisplayName?.UserLocalizedLabel?.Label; // Optional chaining for handling missing values
            if (attrDisplayName) {
                logicalNameDisplayName.push(attrDisplayName)
                logicalNameDisplayName.push(attr.LogicalName)
            }
        })

        return logicalNameDisplayName
    }

    return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFormXMLFromResponse(jsonResponse: any): string {
    if (jsonResponse.value[0].formxml) {
        return jsonResponse.value[0].formxml;
    }

    return '';
}

function parseXML(formXml: string) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(formXml, "text/xml");

    // Get all 'row' elements
    const rows = xmlDoc.getElementsByTagName('row');

    const result = [];

    // Iterate over all 'row' elements
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // Get the 'label' and 'control' elements within the current 'row'
        const label = row.getElementsByTagName('label')[0];
        const control = row.getElementsByTagName('control')[0];

        // If both 'label' and 'control' elements exist, create an object and add it to the result array
        if (label && control) {
            const description = label.getAttribute(ATTRIBUTE_DESCRIPTION);
            const datafieldname = control.getAttribute(ATTRIBUTE_DATAFIELD_NAME);
            let classid = control.getAttribute(ATTRIBUTE_CLASSID);

            let controlType = '';
            if (classid) {

                // Use a regular expression to replace both '{' and '}' with an empty string
                // Input: '{5B773807-9FB2-42DB-97C3-7A91EFF8ADFF}'
                // Output: '5B773807-9FB2-42DB-97C3-7A91EFF8ADFF'
                classid = classid.replace(/{|}/g, '');

                controlType = ControlClassIdMap.get(classid) ?? '';
            }

            if (description && datafieldname) {
                result.push(description, datafieldname, controlType);
            }
        }
    }

    return result
}


export async function getEntityName(sessionID: string, dataverseEntity: string): Promise<{ entityName: string, formName: string }> {
    let entityName = '';
    let formName = '';

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
                const parsedData = parseYamlContent(yamlContent, sessionID, dataverseEntity);
                entityName = parsedData['adx_entityname'] || parsedData['adx_targetentitylogicalname'];
                formName = parsedData['adx_formname'];
            } else if (!IS_DESKTOP) {
                const entityMetadata = getEntityMetadata(document.uri.fsPath)
                entityName = entityMetadata.logicalEntityName ?? '';
                formName = entityMetadata.logicalFormName ?? '';
            }
        }
    } catch (error) {
        sendTelemetryEvent({ eventName: CopilotGetEntityFailureEvent, copilotSessionId: sessionID, dataverseEntity: dataverseEntity, error: error as Error });
        entityName = '';
    }
    return { entityName, formName };
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
function parseYamlContent(content: string, sessionID: string, dataverseEntity: string): any {
    try {
        return yaml.parse(content);
    } catch (error) {
        sendTelemetryEvent({ eventName: CopilotYamlParsingFailureEvent, copilotSessionId: sessionID, dataverseEntity: dataverseEntity, error: error as Error });
        return {};
    }
}


//make call to https://org955590f3.crm10.dynamics.com/api/data/v9.2/EntityDefinitions(LogicalName='powerpagesite') to check if the response object contains MetadataId
export async function isEdmEnvironment(orgUrl: string, apiToken: string): Promise<boolean> {
    try {
        const dataverseURL = `${orgUrl.endsWith('/') ? orgUrl : orgUrl.concat('/')}api/data/v9.2/EntityDefinitions(LogicalName='powerpagesite')`;
        const requestInit: RequestInit = {
            method: "GET",
            headers: {
                'Content-Type': "application/json",
                Authorization: `Bearer ${apiToken}`,
                "x-ms-user-agent": getUserAgent()
            },
        };

        const startTime = performance.now();
        const jsonResponse = await fetchJsonResponse(dataverseURL, requestInit);
        const endTime = performance.now();
        const responseTime = endTime - startTime || 0;

        sendTelemetryEvent({ eventName: isEdmEnvironment.name, durationInMills: responseTime, orgUrl: orgUrl })
        return jsonResponse.MetadataId !== undefined

    } catch (error) {
        sendTelemetryEvent({ eventName: isEdmEnvironment.name, error: error as Error, orgUrl: orgUrl})
        return false;
    }
}