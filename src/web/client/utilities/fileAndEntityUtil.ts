/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { IAttributePath } from "../common/interfaces";

// File utility functions
export function fileHasDirtyChanges(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.hasDirtyChanges as boolean;
}

export function getFileEntityId(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.entityId as string ?? WebExtensionContext.getVscodeWorkspaceState(fileFsPath)?.entityId as string;
}

export function getFileEntityName(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.entityName as string ?? WebExtensionContext.getVscodeWorkspaceState(fileFsPath)?.entityName as string;
}

export function getFileEntityEtag(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.entityEtag as string;
}

export function updateFileEntityEtag(fileFsPath: string, entityEtag: string) {
    WebExtensionContext.fileDataMap.updateEtagValue(fileFsPath, entityEtag);
}

export function updateFileDirtyChanges(
    fileFsPath: string,
    hasDirtyChanges: boolean
) {
    WebExtensionContext.fileDataMap.updateDirtyChanges(
        fileFsPath,
        hasDirtyChanges
    );
}

export function doesFileExist(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.has(vscode.Uri.parse(fileFsPath).fsPath);
}

// Entity utility functions
export function getEntityEtag(entityId: string) {
    return WebExtensionContext.entityDataMap.getEntityMap.get(entityId)
        ?.entityEtag as string;
}

export function updateEntityEtag(entityId: string, entityEtag: string) {
    WebExtensionContext.entityDataMap.updateEtagValue(
        entityId,
        entityEtag
    );
}

export function updateEntityColumnContent(
    entityId: string,
    attributePath: IAttributePath,
    fileContent: string
) {
    WebExtensionContext.entityDataMap.updateEntityColumnContent(
        entityId,
        attributePath,
        fileContent
    );
}

export function getFileName(fsPath: string) {
    return fsPath.split(/[\\/]/).pop();
}
