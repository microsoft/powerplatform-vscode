/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    WorkspaceFolder
} from 'vscode-languageserver/node';
import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'yaml';
import { GetWebsiteRecordID, sendTelemetryEvent } from '../OneDSLoggerTelemetry/telemetry/telemetry';
import { POWERPAGES_SITE_FOLDER, WEBSITE_YML } from '../constants';

export function getPortalsOrgURLs(workspaceRootFolders: WorkspaceFolder[] | null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let output: any[] = [];
    try {
        workspaceRootFolders?.forEach(workspaceRootFolder => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const manifestFiles = glob.sync('**/*-manifest.yml', { dot: true, cwd: workspaceRootFolder!.uri });
            if (manifestFiles.length == 0) {
                output = [{
                    orgURL: '',
                    isManifestExists: false
                }];
            } else {
                manifestFiles?.forEach(manifestFile => {
                    output.push({
                        orgURL: manifestFile.split("-manifest")[0].replace(/.*[portalconfig]\//, ''),
                        isManifestExists: true
                    });
                })
            }
        });
    } catch (exception) {
        sendTelemetryEvent({ methodName: getPortalsOrgURLs.name, eventName: 'getPortalsOrgURLs', exception: exception as Error });
    }
    return output;
}

export function getWebsiteRecordId(param: { uri: string }[] | string): string {
    try {
        let workspaceFolderPath = "";

        if (Array.isArray(param) && param.length > 0) {
            workspaceFolderPath = param[0].uri;
        }
        else if (typeof param === 'string') {
            workspaceFolderPath = param;
        }

        if (!workspaceFolderPath) {
            return "";
        }

        const websiteYmlPath = path.join(workspaceFolderPath, WEBSITE_YML);
        if (fs.existsSync(websiteYmlPath)) {
            const fileContent = fs.readFileSync(websiteYmlPath, 'utf8');
            const parsedYaml = parse(fileContent);
            if (parsedYaml && parsedYaml.adx_websiteid) {
                return parsedYaml.adx_websiteid;
            }
        }
    } catch (exception) {
        sendTelemetryEvent({ methodName: getWebsiteRecordId.name, eventName: GetWebsiteRecordID, exception: exception as Error });
    }
    return "";
}

export function findWebsiteYmlFolder(startPath: string): string | null {
    let currentPath = startPath;
    while (currentPath) {
        if (fs.existsSync(path.join(currentPath, WEBSITE_YML))) {
            return currentPath;
        }
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
            break;
        }
        currentPath = parentPath;
    }
    return null;
}

export function findPowerPagesSiteFolder(startPath: string): string | null {
    let currentPath = startPath;
    while (currentPath) {
        if (fs.existsSync(path.join(currentPath, POWERPAGES_SITE_FOLDER))) {
            return currentPath;
        }
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
            break;
        }
        currentPath = parentPath;
    }
    return null;
}

/**
 * Checks if a website.yml file exists in the specified directory
 * @param directoryPath The directory path to check
 * @returns True if website.yml exists, false otherwise
 */
export function hasWebsiteYaml(directoryPath: string): boolean {
    const websiteYamlPath = path.join(directoryPath, WEBSITE_YML);
    return fs.existsSync(websiteYamlPath);
}

/**
 * Gets the path to the website.yml file in the specified directory
 * @param directoryPath The directory path
 * @returns The full path to website.yml
 */
export function getWebsiteYamlPath(directoryPath: string): string {
    return path.join(directoryPath, WEBSITE_YML);
}

/**
 * Gets the path to the .powerpages-site folder in the specified directory
 * @param directoryPath The directory path
 * @returns The full path to .powerpages-site folder
 */
export function getPowerPagesSiteFolderPath(directoryPath: string): string {
    return path.join(directoryPath, POWERPAGES_SITE_FOLDER);
}
