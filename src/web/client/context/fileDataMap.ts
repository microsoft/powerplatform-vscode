/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { FileData } from "./fileData";
import { IAttributePath } from "../common/interfaces";

export class FileDataMap {
    private fileMap: Map<string, FileData> = new Map<string, FileData>();

    public get getFileMap(): Map<string, FileData> {
        return this.fileMap;
    }

    public setEntity(
        fileUri: string,
        entityId: string,
        entityName: string,
        fileName: string,
        odataEtag: string,
        fileExtension: string,
        attributePath: IAttributePath,
        isBase64Encoded: boolean,
        mimeType?: string,
        isContentLoaded?: boolean,
        logicalEntityName?: string
    ) {
        const fileData = new FileData(
            entityId,
            entityName,
            fileName,
            odataEtag,
            fileExtension,
            attributePath,
            isBase64Encoded,
            mimeType,
            isContentLoaded,
            logicalEntityName
        );
        this.fileMap.set(vscode.Uri.parse(fileUri).fsPath, fileData);
    }

    public updateDirtyChanges(fileFsPath: string, dirtyFlagValue: boolean) {
        const existingEntity = this.fileMap.get(fileFsPath);

        if (existingEntity) {
            existingEntity.setHasDirtyChanges = dirtyFlagValue;
            return;
        }
        throw Error("File does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }

    public updateDiffViewTriggered(fileFsPath: string, diffViewTriggerValue: boolean) {
        const existingEntity = this.fileMap.get(fileFsPath);

        if (existingEntity) {
            existingEntity.setHasDiffViewTriggered = diffViewTriggerValue;
            return;
        }
        throw Error("File does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }

    public updateEtagValue(fileFsPath: string, etag: string) {
        const existingEntity = this.fileMap.get(fileFsPath);

        if (existingEntity) {
            existingEntity.setEntityEtag = etag;
            return;
        }
        throw Error("File does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }
}
