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

const portalConfigFolderName = '.portalconfig';


export function getPortalConfigFolderUrl(workspaceRootFolders : WorkspaceFolder[] | null, pathOfFileBeingEdited: string): URL | null {
    const rootFolder = getRootFolder(workspaceRootFolders, pathOfFileBeingEdited);
    return searchPortalConfigFolder(rootFolder, pathOfFileBeingEdited);
}

/**
 * returns path of .portalConfigFolder if found under 'rootFolder' else returns null
*/
function searchPortalConfigFolder(rootFolder: string | null, file: string): URL | null {
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
