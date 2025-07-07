/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IAttributePath, IFileInfo } from "../common/interfaces";
import { SchemaEntityMetadata } from "../schema/constants";

export interface IFileData extends IFileInfo {
    entityEtag: string;
    entityFileExtensionType: string;
    attributePath: IAttributePath;
    hasDirtyChanges: boolean;
    hasDiffViewTriggered: boolean;
    encodeAsBase64: boolean | undefined;
    mimeType: string | undefined;
    isContentLoaded?: boolean;
    logicalEntityName?: string;
    webpageName?: string;
}

export class FileData implements IFileData {
    private _entityName: string;
    private _fileName: string;
    private _entityId: string;
    private _entityEtag: string;
    private _entityFileExtensionType: string;
    private _attributePath: IAttributePath;
    private _hasDirtyChanges!: boolean;
    private _hasDiffViewTriggered!: boolean;
    private _encodeAsBase64: boolean | undefined;
    private _mimeType: string | undefined;
    private _isContentLoaded: boolean | undefined;
    private _entityMetadata: SchemaEntityMetadata | undefined;
    private _webpageName: string | undefined;

    // Getters
    public get entityName(): string {
        return this._entityName;
    }
    public get fileName(): string {
        return this._fileName;
    }
    public get entityId(): string {
        return this._entityId;
    }
    public get entityEtag(): string {
        return this._entityEtag;
    }
    public get entityFileExtensionType(): string {
        return this._entityFileExtensionType;
    }
    public get attributePath(): IAttributePath {
        return this._attributePath;
    }
    public get encodeAsBase64(): boolean | undefined {
        return this._encodeAsBase64;
    }
    public get mimeType(): string | undefined {
        return this._mimeType;
    }
    public get hasDirtyChanges(): boolean {
        return this._hasDirtyChanges;
    }
    public get hasDiffViewTriggered(): boolean {
        return this._hasDiffViewTriggered;
    }
    public get isContentLoaded(): boolean | undefined {
        return this._isContentLoaded;
    }

    public get entityMetadata(): SchemaEntityMetadata | undefined {
        return this._entityMetadata;
    }

    public get webpageName(): string | undefined {
        return this._webpageName;
    }

    // Setters
    public set setHasDirtyChanges(value: boolean) {
        this._hasDirtyChanges = value;
    }
    public set setEntityEtag(value: string) {
        this._entityEtag = value;
    }
    public set setHasDiffViewTriggered(value: boolean) {
        this._hasDiffViewTriggered = value;
    }

    public set setentityMetadata(value: SchemaEntityMetadata) {
        this._entityMetadata = value;
    }

    public set setWebpageName(value: string) {
        this._webpageName = value;
    }

    constructor(
        entityId: string,
        entityName: string,
        fileName: string,
        entityEtag: string,
        entityFileExtensionType: string,
        attributePath: IAttributePath,
        encodeAsBase64?: boolean,
        mimeType?: string,
        isContentLoaded?: boolean,
        entityMetadata?: SchemaEntityMetadata
    ) {
        this._entityId = entityId;
        this._entityName = entityName;
        this._fileName = fileName;
        this._entityEtag = entityEtag;
        this._entityFileExtensionType = entityFileExtensionType;
        this._attributePath = attributePath;
        this._encodeAsBase64 = encodeAsBase64;
        this._mimeType = mimeType;
        this._hasDirtyChanges = false;
        this._hasDiffViewTriggered = false;
        this._isContentLoaded = isContentLoaded;
        this._entityMetadata = entityMetadata
    }
}
