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
