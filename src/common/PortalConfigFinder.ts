/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    WorkspaceFolder
} from 'vscode-languageserver/node';
import { URL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import { sendTelemetryEvent} from "../client/power-pages/telemetry";
import { ITelemetry } from "../client/telemetry/ITelemetry";

const portalConfigFolderName = '.portalconfig';

export function workspaceContainsPortalConfigFolder(workspaceRootFolders: WorkspaceFolder[] | null): boolean {
    return workspaceRootFolders?.some(workspaceRootFolder => {
        return glob.sync('**/website.yml', { cwd: workspaceRootFolder.uri }).length
    }) || false
}

export function getPortalConfigFolderUrl(workspaceRootFolders: WorkspaceFolder[] | null, pathOfFileBeingEdited: string): URL | null {
    for (let i = 0; workspaceRootFolders && i < workspaceRootFolders?.length; i++) {
        const portalConfigFolderUrl = searchPortalConfigFolder(workspaceRootFolders[i].uri, pathOfFileBeingEdited);
        if (portalConfigFolderUrl) {
            return portalConfigFolderUrl;
        }
    }
    return null;
}

/**
 * returns path of .portalConfigFolder if found under 'rootFolder' else returns null
*/
export function searchPortalConfigFolder(rootFolder: string | null, file: string): URL | null {
    if (!rootFolder) return null; // if a file is directly opened in VSCode
    if (!file.startsWith(rootFolder)) return null; // if 'file' is not a node in the tree with root as 'rootFolder'
    if (file === rootFolder) return null; // if we have already traversed all the nodes in the tree under 'rootFolder'
    const portalConfigIsSibling = isSibling(file);
    if (portalConfigIsSibling) {
        return portalConfigIsSibling;
    }
    return searchPortalConfigFolder(rootFolder, getParentDirectory(file));
}

/**
 * returns parent directory/folder of a file
*/
function getParentDirectory(file: string): string {
    return path.dirname(file);
}

/**
 * Checks if the .portalconfig folder lies at the same level as file.
 * Returns path of .portalconfig folder if above is true else returns null.
*/
function isSibling(file: string): URL | null {
    const parentDirectory = getParentDirectory(file);
    if (parentDirectory) {
        const parentDirectoryUrl = new URL(parentDirectory);
        const parentDirectoryContents: string[] = fs.readdirSync(parentDirectoryUrl);
        for (let i = 0; i < parentDirectoryContents.length; i++) {
            const fileName = parentDirectoryContents[i];
            const filePath = path.join(parentDirectoryUrl.href, fileName);
            const fileUrl = new URL(filePath);
            if (fileName === portalConfigFolderName) {
                return fileUrl;
            }
        }
    }
    return null;
}

export function getPortalsOrgURLs(workspaceRootFolders:WorkspaceFolder[] | null, telemetry: ITelemetry ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let output: any[] = [];
    try {
        workspaceRootFolders?.forEach(workspaceRootFolder => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const manifestFiles  = glob.sync('**/*-manifest.yml', { dot: true, cwd: workspaceRootFolder!.uri });
            if (manifestFiles.length == 0) {
                output = [{
                    orgURL: '',
                    isManifestExists: false
                }];
            }else {
                manifestFiles?.forEach(manifestFile =>{
                    output.push({
                        orgURL: manifestFile.split("-manifest")[0].replace(/.*[portalconfig]\//,''),
                        isManifestExists: true
                    });
                })
            }
        });
    }catch(exception){
        sendTelemetryEvent(telemetry, { methodName:getPortalsOrgURLs.name,eventName: 'getPortalsOrgURLs', exception: exception as Error });
    }
    return output;
}