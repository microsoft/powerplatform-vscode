/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    WorkspaceFolder
} from 'vscode-languageserver/node';
import { URL, fileURLToPath, pathToFileURL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';

const portalConfigFolderName = '.portalconfig';

/**
 * Converts a URI string or file path to a file system path.
 * Handles both file:// URIs and plain paths.
 */
function toFileSystemPath(uriOrPath: string): string {
    if (uriOrPath.startsWith('file://')) {
        return fileURLToPath(uriOrPath);
    }
    return uriOrPath;
}

/**
 * Converts a file system path or URI to a URL object.
 * Handles both file:// URIs and plain paths.
 */
function toFileURL(uriOrPath: string): URL {
    if (uriOrPath.startsWith('file://')) {
        return new URL(uriOrPath);
    }
    return pathToFileURL(uriOrPath);
}

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

    // Normalize both paths to file system paths for consistent comparison
    const normalizedRootFolder = toFileSystemPath(rootFolder);
    const normalizedFile = toFileSystemPath(file);

    if (!normalizedFile.startsWith(normalizedRootFolder)) return null; // if 'file' is not a node in the tree with root as 'rootFolder'
    if (normalizedFile === normalizedRootFolder) return null; // if we have already traversed all the nodes in the tree under 'rootFolder'
    const portalConfigIsSibling = isSibling(normalizedFile);
    if (portalConfigIsSibling) {
        return portalConfigIsSibling;
    }
    const parentDir = path.dirname(normalizedFile);
    // Prevent infinite recursion at filesystem root
    if (parentDir === normalizedFile) return null;
    return searchPortalConfigFolder(normalizedRootFolder, parentDir);
}

/**
 * Checks if the .portalconfig folder lies at the same level as file.
 * Returns path of .portalconfig folder if above is true else returns null.
 * @param file - A normalized file system path (not a URI)
*/
function isSibling(file: string): URL | null {
    const parentDirectory = path.dirname(file);
    if (parentDirectory) {
        const parentDirectoryContents: string[] = fs.readdirSync(parentDirectory);
        for (let i = 0; i < parentDirectoryContents.length; i++) {
            const fileName = parentDirectoryContents[i];
            if (fileName === portalConfigFolderName) {
                const filePath = path.join(parentDirectory, fileName);
                return toFileURL(filePath);
            }
        }
    }
    return null;
}
