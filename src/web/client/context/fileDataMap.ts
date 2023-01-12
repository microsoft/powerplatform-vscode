/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { IAttributePath } from "../utilities/schemaHelperUtil";
import { FileData } from "./fileData";

export class FileDataMap {
    private fileMap: Map<string, FileData> = new Map<string, FileData>;

    public get getFileMap(): Map<string, FileData> { return this.fileMap; }

    public setEntity(
        fileUri: string,
        entityId: string,
        entityName: string,
        odataEtag: string,
        fileExtension: string,
        attributePath: IAttributePath,
        isBase64Encoded: boolean,
        mimeType?: string
    ) {
        const fileData = new FileData(entityId,
            entityName,
            odataEtag,
            fileExtension,
            attributePath,
            isBase64Encoded,
            mimeType);
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
}
