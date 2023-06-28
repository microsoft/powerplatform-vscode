/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import WebExtensionContext from "../WebExtensionContext";
import { IAttributePath } from "../common/interfaces";

// File utility functions
export function fileHasDirtyChanges(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.hasDirtyChanges as boolean;
}

export function getFileEntityId(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.entityId as string;
}

export function getFileEntityType(fileFsPath: string) {
    return WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath)
        ?.entityName as string;
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
