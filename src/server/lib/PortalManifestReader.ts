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

export function getMatchedManifestRecords(workspaceRootFolders : WorkspaceFolder[] | null, keyForCompletion: string, pathOfFileBeingEdited?: string) : IManifestElement[] {
    let matchedManifestRecords: IManifestElement[] = [];
    if (pathOfFileBeingEdited) {
        const rootFolder = getRootFolder(workspaceRootFolders, pathOfFileBeingEdited);
        const portalConfigFolderUrl = getPortalConfigFolderUrl(rootFolder, pathOfFileBeingEdited) as URL | null; //https://github.com/Microsoft/TypeScript/issues/11498
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

/**
 * returns path of .portalConfigFolder if found under 'rootFolder' else returns null
*/
function getPortalConfigFolderUrl(rootFolder: string | null, file: string): URL | null {
    if (!rootFolder) return null; // if a file is directly opened in VSCode
    if (!file.startsWith(rootFolder)) return null; // if 'file' is not a node in the tree with root as 'rootFolder'
    if (file === rootFolder) return null; // if we have already traversed all the nodes in the tree under 'rootFolder'
    const portalConfigIsSibling = isSibling(file);
    if (portalConfigIsSibling) {
        return portalConfigIsSibling;
    }
    return getPortalConfigFolderUrl(rootFolder, getParentDirectory(file));
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
            const isDirectory = fs.statSync(fileUrl).isDirectory();
            if (isDirectory && fileName === portalConfigFolderName) {
                return fileUrl;
            }
        }
    }
    return null;
}

/**
 * returns the workspaceRootFolder for the file being edited
 * in case of multi-root workspaces this will return the real root folder
*/
function getRootFolder(workspaceRootFolders: WorkspaceFolder[] | null, pathOfFileBeingEdited: string) : string | null{
    if (workspaceRootFolders) {
        let rootFolder = '';
        for (let i = 0; i < workspaceRootFolders?.length; i++) {
            const wsRootFolder = workspaceRootFolders[i].uri;
            // among all the 'workspaceRootFolders' the one with the longest substring of 'file' is the real root folder
            if(pathOfFileBeingEdited.startsWith(wsRootFolder) && wsRootFolder.length > rootFolder.length) {
                rootFolder = wsRootFolder;
            }
        }
        return rootFolder;
    }
    return null;
}
