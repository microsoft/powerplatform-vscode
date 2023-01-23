/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import path from "path";
import * as vscode from "vscode";


export const isNullOrEmpty = (str: string | undefined): boolean => {
    return !str || str.trim().length === 0;
};

/**
 * @example
 * formatFolderName("My Folder Name"); // "my-folder-name"
 */
export const formatFolderName = (name: string) => {
    return name.replace(/[/ ]/g, "-").toLowerCase();
};

/**
 * @example
 * formatFileName("My File Name"); // "My-File-Name"
 */
export const formatFileName = (name: string) => {
    const words = name.split(/[/ ]/);

    // Uppercase the first letter of each word and join the words back together
    return words.map((word) => word[0].toUpperCase() + word.slice(1)).join("-");
};

export const checkPackageExistence = async (
    packagePath: string
): Promise<boolean> => {
    const packageExistsCache = await vscode.workspace.findFiles(
        path.join("**", packagePath)
    );

    if (packageExistsCache && packageExistsCache.length > 0) {
        return true;
    } else {
        throw new Error(`Package ${packagePath} does not exist.`);
    }
};
