/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import path from "path";
import * as vscode from "vscode";
import fs from "fs";
import yaml from 'yaml';

interface Attribute {
    LogicalName: string;
}

export async function getEntityColumns(entityName: string, orgUrl: string, apiToken: string): Promise<string[]> {
    try {
        const dataverseURL = `${orgUrl}api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')?$expand=Attributes($select=LogicalName)`;
        const requestInit: RequestInit = {
            method: "GET",
            headers: {
                'Content-Type': "application/json",
                Authorization: `Bearer ${apiToken}`,
            },
        };

        const jsonResponse = await fetchJsonResponse(dataverseURL, requestInit);
        const attributes = getAttributesFromResponse(jsonResponse);

        return attributes.map((attribute: Attribute) => attribute.LogicalName);
    } catch (error) {
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


export function getEntityName(): string {
    let entityName = '';

    try {
        const activeEditor = vscode.window.activeTextEditor;

        if (activeEditor) {
            const document = activeEditor.document;
            const absoluteFilePath = document.fileName;
            const activeFileFolderPath = path.dirname(absoluteFilePath);
            const activeFileName = path.basename(absoluteFilePath);
            const fileNameFirstPart = activeFileName.split('.')[0];

            const matchingFiles = getMatchingFiles(activeFileFolderPath, fileNameFirstPart);

            if (matchingFiles[0]) {
                const yamlFilePath = path.join(activeFileFolderPath, matchingFiles[0]);
                const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');
                const parsedData = parseYamlContent(yamlContent);
                entityName = parsedData['adx_entityname'] || parsedData['adx_targetentitylogicalname'];
            }
        }
    } catch (error) {
        entityName = '';
    }

    return entityName;
}

function getMatchingFiles(folderPath: string, fileNameFirstPart: string): string[] {
    const files = fs.readdirSync(folderPath);
    const pattern = new RegExp(`^${fileNameFirstPart}..*.yml$`);
    return files.filter((fileName) => pattern.test(fileName));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseYamlContent(content: string): any {
    try {
        return yaml.parse(content);
    } catch (error) {
        return {};
    }
}

