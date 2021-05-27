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

function getPortalConfigFolderUrl(workspaceRootFolder : WorkspaceFolder[] | null): URL | null {
    const workspaceRootFolderUri = workspaceRootFolder && workspaceRootFolder[0].uri;
    let portalConfigFolderUrl = null;
    if (workspaceRootFolderUri !== null) {
        const workspaceRootFolderUrl = new URL(workspaceRootFolderUri);
        const workspaceRootFolderContents: string[] = fs.readdirSync(workspaceRootFolderUrl);
        for (let i = 0; i < workspaceRootFolderContents.length; i++) {
            const fileName = workspaceRootFolderContents[i];
            const filePath = path.join(workspaceRootFolderUrl.href, fileName);
            const fileUrl = new URL(filePath);
            const isDirectory = fs.statSync(fileUrl).isDirectory();
            if (isDirectory && fileName === portalConfigFolderName) {
                portalConfigFolderUrl = fileUrl;
                return portalConfigFolderUrl;
            }
        }
    }
    return portalConfigFolderUrl;
}

export function getMatchedManifestRecords(workspaceRootFolder : WorkspaceFolder[] | null, keyForCompletion: string) : IManifestElement[] {
    let matchedManifestRecords: IManifestElement[] = [];
    const portalConfigFolderUrl = getPortalConfigFolderUrl(workspaceRootFolder) as URL | null; //https://github.com/Microsoft/TypeScript/issues/11498
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
    return matchedManifestRecords;
}
