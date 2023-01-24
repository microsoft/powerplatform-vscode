/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { EntityFolderMap, EntityFolderName, PowerPagesEntityType } from "./constants";

export interface IFileProperties {
    fileCompleteName?: string,
    fileNameIndex?: number,
    fileName?: string,
    fileExtension?: string
}

export function getFileProperties(fsPath: string): IFileProperties {
    const filePathTokens = fsPath.split("\\");
    const fileCompleteName = filePathTokens.pop();
    let fileNameIndex, fileName;

    if (fileCompleteName) {
        fileNameIndex = fsPath.indexOf(fileCompleteName);
        fileName = fileCompleteName?.split('.').shift();
    }

    return {
        fileCompleteName: fileCompleteName,
        fileName: fileName,
        fileExtension: '',
        fileNameIndex: fileNameIndex
    }
}

export function isValidDocument(fsPath: string): PowerPagesEntityType {
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
    const deletePathUri = vscode.Uri.file(fsPath.substring(0, fileProperties.fileNameIndex));
    if (fileEntityType === PowerPagesEntityType.WEBPAGES && isValidUri(deletePathUri.fsPath)) {
        pathUris.push(vscode.Uri.file(fsPath.substring(0, fileProperties.fileNameIndex)));
    }

    return pathUris;
}

export function isValidUri(fsPath: string): boolean {
    let validUri = true;

    EntityFolderName.forEach(folderName => {
        folderName = folderName.toLowerCase();

        if (fsPath.endsWith(`\\${folderName}\\`)) {
            validUri = false;
        }
    });

    return validUri;
}



