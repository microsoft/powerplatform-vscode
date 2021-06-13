/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
    WorkspaceFolder
} from 'vscode-languageserver/node';
import { URL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'yaml';

const portalConfigFolderName = '.portalconfig';
const manifest = '-manifest';

export interface IManifestElement {
    DisplayName: string;
    RecordId: string;
}

export function getMatchedManifestRecords(workspaceRootFolder : WorkspaceFolder[] | null, keyForCompletion: string, pathOfFileBeingEdited?: string) : IManifestElement[] {
    let matchedManifestRecords: IManifestElement[] = [];
    if (pathOfFileBeingEdited) {
        const portalConfigFolderUrl = getPortalConfigFolderUrl(pathOfFileBeingEdited) as URL | null; //https://github.com/Microsoft/TypeScript/issues/11498
        if (portalConfigFolderUrl && keyForCompletion) {
            const configFiles: string[] = fs.readdirSync(portalConfigFolderUrl);
            configFiles.forEach(configFile => {
                if (configFile.includes(manifest)) { // this is based on the assumption that there will be only one manifest file in portalconfig folder
                    const manifestFilePath = path.join(portalConfigFolderUrl.href, configFile);
                    const manifestData = fs.readFileSync(new URL(manifestFilePath), 'utf8');
                    try {
                        const parsedManifestData = YAML.parse(manifestData);
                        matchedManifestRecords = parsedManifestData[keyForCompletion];
                    } catch (exception) {
                        // Add telemetry log. Failed parsing manifest file
                    }
                }
            })
        }
    }
    return matchedManifestRecords;
}

// check when to stop this recursion...this should be at the root of the workspace folder
function getPortalConfigFolderUrl(file: string): URL | null {
    const portalConfigIsSibling = isSibling(file);
    if (portalConfigIsSibling) {
        return portalConfigIsSibling;
    }
    return getPortalConfigFolderUrl(getParentDirectory(file));
}

function getParentDirectory(pathOfFileBeingEdited: string): string {
    const fileUnderEdit_parent = path.dirname(pathOfFileBeingEdited);
    return fileUnderEdit_parent;
}

function isSibling(file: string): URL | null {
    const parentDirectory = getParentDirectory(file);
    if (parentDirectory) {
        const parentDirectoryUrl = new URL(parentDirectory);
        const parentDirectoryContents: string[] = fs.readdirSync(parentDirectoryUrl);
        for (let i = 0; i < parentDirectoryContents.length; i++) {
            const fileName = parentDirectoryContents[i];
            const filePath = path.join(parentDirectoryUrl.href, fileName);
            const fileUrl = new URL(filePath);
            const isDirectory = fs.statSync(fileUrl).isDirectory();
            if (isDirectory && fileName === portalConfigFolderName) {
                return fileUrl;
            }
        }
    }
    return null;
}
