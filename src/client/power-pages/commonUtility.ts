/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as Constants from "./constants";

export interface IFileProperties {
    fileCompleteName?: string,
    fileNameIndex?: number,
    fileName?: string,
    fileExtension: string,
    fileFolderPath: string
}

export interface IFileNameProperties {
    fileName?: string,
    formattedFileName?: string
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

export function getPowerPageEntityType(fsPath: string): Constants.PowerPagesEntityType {
    let pagesEntityType = Constants.PowerPagesEntityType.UNKNOWN;

    Constants.EntityFolderName.forEach(folderName => {
        folderName = folderName.toLowerCase();

        if (fsPath.includes(`\\${folderName}\\`)) {
            pagesEntityType = Constants.EntityFolderMap.get(folderName) ?? Constants.PowerPagesEntityType.UNKNOWN;
        }
    });

    return pagesEntityType;
}

export function getDeletePathUris(fsPath: string,
    fileEntityType: Constants.PowerPagesEntityType,
    fileProperties: IFileProperties
): vscode.Uri[] {
    const pathUris: vscode.Uri[] = [];
    const entityFolderName = getEntityFolderName(fsPath);
    if (isValidUri(fsPath) && fileProperties.fileName) {
        if (fileEntityType === Constants.PowerPagesEntityType.WEBFILES) {
            const ymlExtensionIndex = fsPath.indexOf(Constants.WebFileYmlExtension);
            ymlExtensionIndex === -1 ? pathUris.push(vscode.Uri.file(fsPath.concat(Constants.WebFileYmlExtension))) :
                pathUris.push(vscode.Uri.file(fsPath.substring(0, ymlExtensionIndex)));
        } else if (!isSingleFileEntity(fileEntityType)) {
            const folderPathNameIndex = getEntityFolderPathIndex(fsPath, fileProperties.fileName, fileEntityType, entityFolderName);

            pathUris.push(vscode.Uri.file(fsPath.substring(0, folderPathNameIndex)));
        }
    }

    return pathUris;
}

export function isValidUri(fsPath: string): boolean {
    let validUri = true;

    Constants.EntityFolderName.forEach(folderName => {
        if (fsPath.toLowerCase().endsWith(`\\${folderName}\\`)) {
            validUri = false;
        }
    });

    return validUri;
}

export function getEntityFolderName(fsPath: string): string {
    let entityFolderPath = '';

    if (fsPath.includes(`\\${Constants.AdvancedFormsStep}\\`)) {
        entityFolderPath = Constants.AdvancedFormsStep;
    } else {
        Constants.EntityFolderName.forEach(folderName => {
            if (fsPath.includes(`\\${folderName}\\`)) {
                entityFolderPath = folderName;
            }
        });
    }

    return entityFolderPath;
}

export function getEntityFolderPathIndex(fsPath: string, fileName: string, fileEntityType: Constants.PowerPagesEntityType, entityFolderName: string) {
    return isSingleFileEntity(fileEntityType) ? fsPath.indexOf(`\\${entityFolderName}\\`) + entityFolderName.length + 2 :
        fsPath.indexOf(`\\${fileName?.toLowerCase()}\\`) + fileName?.length + 2; // offset for path separator
}

export function getValidatedEntityPath(folderPath: string, fileName: string, fileExtension: string): vscode.Uri {
    return vscode.Uri.file(folderPath + [fileName, fileExtension].join('.'));
}

export function isValidRenamedFile(fsPath: string, entityFolderName: string, fileName: string, fileEntityType: Constants.PowerPagesEntityType): boolean {
    return isSingleFileEntity(fileEntityType) ? fsPath.includes(`\\${entityFolderName}\\${fileName}`) :
        fsPath.includes(`\\${entityFolderName}\\${fileName.toLowerCase()}\\`);
}

export function getUpdatedFolderPath(fsPath: string, oldFileName: string, newFileName: string): vscode.Uri {
    return vscode.Uri.file(fsPath.replace(`\\${oldFileName.toLowerCase()}\\`, `\\${newFileName.toLowerCase()}\\`));
}

export function getCurrentWorkspaceURI(fsPath: string): vscode.Uri | undefined {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fsPath));
    return workspaceFolder ? workspaceFolder.uri : undefined;
}

export function isSingleFileEntity(fileEntityType: Constants.PowerPagesEntityType) {
    return fileEntityType === Constants.PowerPagesEntityType.WEBFILES
        || fileEntityType === Constants.PowerPagesEntityType.TABLE_PERMISSIONS
        || fileEntityType === Constants.PowerPagesEntityType.POLL_PLACEMENTS
        || fileEntityType === Constants.PowerPagesEntityType.PAGE_TEMPLATES
        || fileEntityType === Constants.PowerPagesEntityType.LISTS;
}

export function getFileNameProperties(fsPath: string, fileEntityType: Constants.PowerPagesEntityType): IFileNameProperties {
    const fileProperties = getFileProperties(fsPath);
    let formattedName = fileProperties.fileName?.replace('-', ' ');

    if (fileProperties.fileName) {
        const ymlExtensionIndex = fileProperties.fileCompleteName?.indexOf(Constants.WebFileYmlExtension) ?? -1;

        if (fileEntityType === Constants.PowerPagesEntityType.WEBFILES && ymlExtensionIndex > 0) {
            formattedName = fileProperties.fileCompleteName?.substring(0, ymlExtensionIndex);
        }
    }

    return {
        fileName: fileProperties.fileName,
        formattedFileName: formattedName
    };
}

export function getFieldsToUpdate(fileEntityType: Constants.PowerPagesEntityType): string[] {
    const fieldsToUpdate: string[] = [];

    if (fileEntityType === Constants.PowerPagesEntityType.WEBPAGES) {
        fieldsToUpdate.push(Constants.DataverseFieldAdxTitle);
        fieldsToUpdate.push(Constants.DataverseFieldAdxPartialUrl);
        fieldsToUpdate.push(Constants.DataverseFieldAdxName);
    } else if (fileEntityType === Constants.PowerPagesEntityType.WEBFILES) {
        fieldsToUpdate.push(Constants.DataverseFieldAdxName);
        fieldsToUpdate.push(Constants.DataverseFieldFilename);
        fieldsToUpdate.push(Constants.DataverseFieldAdxPartialUrl);
    } else if (fileEntityType === Constants.PowerPagesEntityType.TABLE_PERMISSIONS) {
        fieldsToUpdate.push(Constants.DataverseFieldAdxEntityName);
        fieldsToUpdate.push(Constants.DataverseFieldAdxEntityLogicalName);
    } else if (fileEntityType === Constants.PowerPagesEntityType.CONTENT_SNIPPETS) {
        fieldsToUpdate.push(Constants.DataverseFieldAdxDisplayName);
        fieldsToUpdate.push(Constants.DataverseFieldAdxName);
    } else {
        fieldsToUpdate.push(Constants.DataverseFieldAdxName);
    }

    return fieldsToUpdate;
}
