/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { getEntityFolderName, getEntityFolderPathIndex, getFileProperties, getUpdatedFolderPath, getValidatedEntityPath, IFileProperties, isValidRenamedFile, isValidUri } from "./commonUtility";
import { PowerPagesEntityType } from "./constants";

export async function updateEntityPathNames(oldUri: vscode.Uri,
    newUri: vscode.Uri,
    oldFileProperties: IFileProperties,
    fileEntityType: PowerPagesEntityType
) {
    const entityFolderName = getEntityFolderName(oldUri.fsPath);
    if (isValidUri(oldUri.fsPath) && oldFileProperties.fileName && isValidRenamedFile(oldUri.fsPath, entityFolderName, oldFileProperties.fileName, fileEntityType)) {
        const newFileProperties = getFileProperties(newUri.fsPath);
        const entityFolderIndex = getEntityFolderPathIndex(newUri.fsPath, oldFileProperties.fileName, fileEntityType);
        const fileEntityFolderPath = oldFileProperties.fileFolderPath.substring(0, entityFolderIndex);
        const allFilesInFolder = await vscode.workspace.findFiles(fileEntityType === PowerPagesEntityType.WEBFILES ?
            `**/${entityFolderName}/${oldFileProperties.fileName}.*` : `**/${entityFolderName}/${oldFileProperties.fileName.toLowerCase()}/**/*`);

        if (fileEntityType !== PowerPagesEntityType.ADVANCED_FORMS) {
            await Promise.all(allFilesInFolder.map(async file => {
                const fileProperties = getFileProperties(file.fsPath);
                if (fileProperties.fileCompleteName) {
                    const newFilePath = file.fsPath.replace(fileProperties.fileCompleteName, [newFileProperties.fileName, fileProperties.fileExtension].join('.'));
                    if (newFilePath !== file.fsPath) {
                        await vscode.workspace.fs.rename(file, vscode.Uri.file(newFilePath), { overwrite: true });
                    }
                }
            }));
        }

        // FolderName update
        if (newFileProperties.fileName && fileEntityType !== PowerPagesEntityType.WEBFILES) {
            await vscode.workspace.fs.rename(vscode.Uri.file(fileEntityFolderPath),
                getUpdatedFolderPath(fileEntityFolderPath, oldFileProperties.fileName, newFileProperties.fileName),
                { overwrite: true });
        }

        // File Name update in yml file
    }
}

export async function fileRenameValidation(oldUri: vscode.Uri,
    newUri: vscode.Uri,
    oldFileProperties: IFileProperties
) {
    let success = true;
    if (isValidUri(oldUri.fsPath) && oldFileProperties.fileName) {
        const newFileProperties = getFileProperties(newUri.fsPath);

        if (oldFileProperties.fileExtension !== newFileProperties.fileExtension && newFileProperties.fileName && oldFileProperties.fileExtension) {
            await vscode.workspace.fs.rename(newUri, getValidatedEntityPath(newFileProperties.fileFolderPath, newFileProperties.fileName, oldFileProperties.fileExtension), { overwrite: true });
        } else if (oldFileProperties.fileExtension === '') { // revert name changes - entity folder re-naming is not a valid scenario
            await vscode.workspace.fs.rename(newUri, oldUri, { overwrite: true });
            success = false;
        }
    }
    return success;
}
