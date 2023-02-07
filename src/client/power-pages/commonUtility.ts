/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { EntityFolderMap, EntityFolderName, PowerPagesEntityType, WebFileYmlExtension } from "./constants";

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
    const entityFolderName = getEntityFolderName(fsPath);
    if (isValidUri(fsPath) && fileProperties.fileName) {
        if (fileEntityType === PowerPagesEntityType.WEBFILES) {
            const ymlExtensionIndex = fsPath.indexOf(WebFileYmlExtension);
            ymlExtensionIndex === -1 ? pathUris.push(vscode.Uri.file(fsPath.concat(WebFileYmlExtension))) :
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

    EntityFolderName.forEach(folderName => {
        if (fsPath.toLowerCase().endsWith(`\\${folderName}\\`)) {
            validUri = false;
        }
    });

    return validUri;
}

export function getEntityFolderName(fsPath: string): string {
    let entityFolderPath = '';

    EntityFolderName.forEach(folderName => {
        if (fsPath.includes(`\\${folderName}\\`)) {
            entityFolderPath = folderName;
        }
    });

    return entityFolderPath;
}

export function getEntityFolderPathIndex(fsPath: string, fileName: string, fileEntityType: PowerPagesEntityType, entityFolderName: string) {
    return isSingleFileEntity(fileEntityType) ? fsPath.indexOf(`\\${entityFolderName}\\`) + entityFolderName.length + 2 :
        fsPath.indexOf(`\\${fileName?.toLowerCase()}\\`) + fileName?.length + 2; // offset for path separator
}

export function getValidatedEntityPath(folderPath: string, fileName: string, fileExtension: string): vscode.Uri {
    return vscode.Uri.file(folderPath + [fileName, fileExtension].join('.'));
}

export function isValidRenamedFile(fsPath: string, entityFolderName: string, fileName: string, fileEntityType: PowerPagesEntityType): boolean {
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

export function isSingleFileEntity(fileEntityType: PowerPagesEntityType) {
    return fileEntityType === PowerPagesEntityType.WEBFILES
        || fileEntityType === PowerPagesEntityType.TABLE_PERMISSIONS
        || fileEntityType === PowerPagesEntityType.POLL_PLACEMENTS
        || fileEntityType === PowerPagesEntityType.PAGE_TEMPLATES
        || fileEntityType === PowerPagesEntityType.LISTS;
}
