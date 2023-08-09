/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IAttributePath, IFileInfo } from "../common/interfaces";

export interface IFileData extends IFileInfo {
    entityEtag: string;
    entityFileExtensionType: string;
    attributePath: IAttributePath;
    hasDirtyChanges: boolean;
    hasDiffViewTriggered: boolean;
    encodeAsBase64: boolean | undefined;
    mimeType: string | undefined;
    isContentLoaded?: boolean;
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

    constructor(
        entityId: string,
        entityName: string,
        fileName: string,
        entityEtag: string,
        entityFileExtensionType: string,
        attributePath: IAttributePath,
        encodeAsBase64?: boolean,
        mimeType?: string,
        isContentLoaded?: boolean
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
    }
}
