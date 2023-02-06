/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { EntityFolderMap, EntityFolderName, PowerPagesEntityType, WebFilesFolder, WebFileYmlExtension } from "./constants";

export interface IFileProperties {
    fileCompleteName?: string,
    fileNameIndex?: number,
    fileName?: string,
    fileExtension: string,
    fileFolderPath: string
}

export function getFileProperties(fsPath: string): IFileProperties {
    const filePathTokens = fsPath.split("\\");
    const fileCompleteName = filePathTokens.pop();
    let fileNameIndex, fileName, fileExtension = '';

    if (fileCompleteName) {
        fileNameIndex = fsPath.indexOf(fileCompleteName);
        const fileNameTokens = fileCompleteName?.split('.');
        fileName = fileNameTokens.shift();
        fileExtension = fileNameTokens.join('.');
    }

    return {
        fileCompleteName: fileCompleteName,
        fileName: fileName,
        fileExtension: fileExtension,
        fileNameIndex: fileNameIndex,
        fileFolderPath: filePathTokens.join('\\') + '\\'
    }
}

export function getPowerPageEntityType(fsPath: string): PowerPagesEntityType {
    let pagesEntityType = PowerPagesEntityType.UNKNOWN;

    EntityFolderName.forEach(folderName => {
        folderName = folderName.toLowerCase();

        if (fsPath.includes(`\\${folderName}\\`)) {
            pagesEntityType = EntityFolderMap.get(folderName) ?? PowerPagesEntityType.UNKNOWN;
        }
    });

    return pagesEntityType;
}

export function getDeletePathUris(fsPath: string,
    fileEntityType: PowerPagesEntityType,
    fileProperties: IFileProperties
): vscode.Uri[] {
    const pathUris: vscode.Uri[] = [];

    if (isValidUri(fsPath) && fileProperties.fileName) {
        if (fileEntityType === PowerPagesEntityType.WEBFILES) {
            const ymlExtensionIndex = fsPath.indexOf(WebFileYmlExtension);
            ymlExtensionIndex === -1 ? pathUris.push(vscode.Uri.file(fsPath.concat(WebFileYmlExtension))) :
                pathUris.push(vscode.Uri.file(fsPath.substring(0, ymlExtensionIndex)));
        } else {
            const folderPathNameIndex = getEntityFolderPathIndex(fsPath, fileProperties.fileName, fileEntityType);
            pathUris.push(vscode.Uri.file(fsPath.substring(0, folderPathNameIndex)));
        }
    }

    return pathUris;
}

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

export function getCurrentWorkspaceURI(fsPath: string): vscode.Uri | undefined {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fsPath));
    return workspaceFolder ? workspaceFolder.uri : undefined;
}

function isValidUri(fsPath: string): boolean {
    let validUri = true;

    EntityFolderName.forEach(folderName => {
        if (fsPath.toLowerCase().endsWith(`\\${folderName}\\`)) {
            validUri = false;
        }
    });

    return validUri;
}

function getEntityFolderName(fsPath: string): string {
    let entityFolderPath = '';

    EntityFolderName.forEach(folderName => {
        if (fsPath.includes(`\\${folderName}\\`)) {
            entityFolderPath = folderName;
        }
    });

    return entityFolderPath;
}

function getEntityFolderPathIndex(fsPath: string, fileName: string, fileEntityType: PowerPagesEntityType) {
    return fileEntityType === PowerPagesEntityType.WEBFILES ? fsPath.indexOf(`\\${WebFilesFolder}\\`) + WebFilesFolder.length + 2 :
        fsPath.indexOf(`\\${fileName?.toLowerCase()}\\`) + fileName?.length + 2; // offset for path separator
}

function getValidatedEntityPath(folderPath: string, fileName: string, fileExtension: string): vscode.Uri {
    return vscode.Uri.file(folderPath + [fileName, fileExtension].join('.'));
}

function isValidRenamedFile(fsPath: string, entityFolderName: string, fileName: string, fileEntityType: PowerPagesEntityType): boolean {
    return fileEntityType === PowerPagesEntityType.WEBFILES ? fsPath.includes(`\\${entityFolderName}\\${fileName}`) :
        fsPath.includes(`\\${entityFolderName}\\${fileName.toLowerCase()}\\`);
}

function getUpdatedFolderPath(fsPath: string, oldFileName: string, newFileName: string): vscode.Uri {
    return vscode.Uri.file(fsPath.replace(`\\${oldFileName.toLowerCase()}\\`, `\\${newFileName.toLowerCase()}\\`));
}
