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
import { ITelemetry } from '../OneDSLoggerTelemetry/telemetry/ITelemetry';
import { GetWebsiteRecordID, sendTelemetryEvent } from '../OneDSLoggerTelemetry/telemetry/telemetry';

export function getPortalsOrgURLs(workspaceRootFolders: WorkspaceFolder[] | null, telemetry: ITelemetry) {
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
        sendTelemetryEvent(telemetry, { methodName: getPortalsOrgURLs.name, eventName: 'getPortalsOrgURLs', exception: exception as Error });
    }
    return output;
}

export function getWebsiteRecordId(workspaceFolders: { uri: string }[], telemetry: ITelemetry): string {
    try {
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return "";
        }

        const workspaceRootFolder = workspaceFolders[0];
        const websiteYmlPath = path.join(workspaceRootFolder.uri, 'website.yml');
        if (fs.existsSync(websiteYmlPath)) {
            const fileContent = fs.readFileSync(websiteYmlPath, 'utf8');
            const parsedYaml = parse(fileContent);
            if (parsedYaml && parsedYaml.adx_websiteid) {
                return parsedYaml.adx_websiteid;
            }
        }
    } catch (exception) {
        sendTelemetryEvent(telemetry, { methodName: getWebsiteRecordId.name, eventName: GetWebsiteRecordID, exception: exception as Error });
    }
    return "";
}
