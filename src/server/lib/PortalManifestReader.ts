/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    WorkspaceFolder
} from 'vscode-languageserver/node';
import { URL, fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'yaml';
import { getPortalConfigFolderUrl } from '../../common/utilities/PathFinderUtil';

const manifest = '-manifest';

export interface IManifestElement {
    DisplayName: string;
    RecordId: string;
}

export function getMatchedManifestRecords(workspaceRootFolders: WorkspaceFolder[] | null, keyForCompletion: string, pathOfFileBeingEdited?: string): IManifestElement[] {
    let matchedManifestRecords: IManifestElement[] = [];
    if (pathOfFileBeingEdited) {
        const portalConfigFolderUrl = getPortalConfigFolderUrl(workspaceRootFolders, pathOfFileBeingEdited) as URL | null; //https://github.com/Microsoft/TypeScript/issues/11498
        if (portalConfigFolderUrl && keyForCompletion) {
            const portalConfigFolderPath = fileURLToPath(portalConfigFolderUrl);
            const configFiles: string[] = fs.readdirSync(portalConfigFolderPath);
            configFiles.forEach(configFile => {
                if (configFile.includes(manifest)) { // this is based on the assumption that there will be only one manifest file in portalconfig folder
                    const manifestFilePath = path.join(portalConfigFolderPath, configFile);
                    const manifestData = fs.readFileSync(manifestFilePath, 'utf8');
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
