/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { IAttributePath } from "../common/interfaces";
import { SchemaEntityMetadata } from "../schema/constants";

// File utility functions
export function fileHasDirtyChanges(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.hasDirtyChanges as boolean;
}

export function fileHasDiffViewTriggered(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.hasDiffViewTriggered as boolean;
}

export function getFileEntityId(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.entityId as string ?? WebExtensionContext.getVscodeWorkspaceState(fileFsPath)?.entityId as string;
}

export function getFileEntityName(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.entityName as string ?? WebExtensionContext.getVscodeWorkspaceState(fileFsPath)?.entityName as string;
}

export function getFileRootWebPageId(fileFsPath: string) {
    const entityId = getFileEntityId(fileFsPath);
    return (
        (WebExtensionContext.entityDataMap.getEntityMap.get(entityId)
            ?.rootWebPageId as string) ??
        (WebExtensionContext.getVscodeWorkspaceState(fileFsPath)
            ?.rootWebPageId as string) ??
        ""
    );
}

export function getFileAttributePath(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.attributePath as IAttributePath;
}

export function getFileEntityEtag(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.entityEtag as string;
}

export function getEntityMetadata(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)?.entityMetadata as SchemaEntityMetadata
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

export function updateDiffViewTriggered(
    fileFsPath: string,
    hasDiffViewTriggered: boolean
) {
    WebExtensionContext.fileDataMap.updateDiffViewTriggered(
        fileFsPath,
        hasDiffViewTriggered
    );
}

export function doesFileExist(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.has(vscode.Uri.parse(fileFsPath).fsPath);
}

export function getFileName(fsPath: string) {
    return fsPath.split(/[\\/]/).pop();
}

// Entity utility functions
export function getEntityEtag(entityId: string) {
    return WebExtensionContext.entityDataMap.getEntityMap.get(entityId)
        ?.entityEtag as string;
}

export function getEntityMappingEntityId(entityId: string) {
    return WebExtensionContext.entityDataMap.getEntityMap.get(entityId)
        ?.mappingEntityId;
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
    fileContent: string | Uint8Array
) {
    WebExtensionContext.entityDataMap.updateEntityColumnContent(
        entityId,
        attributePath,
        fileContent
    );
}
