/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    WorkspaceFolder
} from 'vscode-languageserver/node';
import { glob } from 'glob';
import { ITelemetry } from '../OneDSLoggerTelemetry/telemetry/ITelemetry';
import { sendTelemetryEvent } from '../OneDSLoggerTelemetry/telemetry/telemetry';

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
