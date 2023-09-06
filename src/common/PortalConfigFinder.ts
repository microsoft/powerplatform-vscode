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
import * as YAML from 'yaml';

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

export function getPortalsOrgURLs(workspaceRootFolders:WorkspaceFolder[] | null) {
    let output = new Array<TelemetryUsageContext>();
    try{
    workspaceRootFolders?.forEach(workspaceRootFolder => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const manifestFiles  = glob.sync('**/*-manifest.yml', { dot: true, cwd: workspaceRootFolder!.uri })[0];
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const manifestFilePath = "" //path.join(portalConfigFolderUrl.href, configFile);
        const websiteFiles  = glob.sync('**/website.yml', { dot: true, cwd: workspaceRootFolder!.uri })[0];
        const websiteData = fs.readFileSync(new URL(websiteFiles), 'utf8');
        const parsedWebsiteData = YAML.parse(websiteData);
        const websiteId = parsedWebsiteData['adx_websiteid'];
        output.push({
            websiteId: websiteId,
            orgId: manifestFiles
        })
        
    });
    }catch(exception){}   
    return output;
}

export interface TelemetryUsageContext {
    websiteId?: string;
    orgId?: string;
}