/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IAttributePath } from "../utilities/schemaHelperUtil";

export interface IFileData {
    readonly entityName: string,
    readonly entityId: string,
    readonly entityFileExtensionType: string,
    readonly attributePath: IAttributePath,
    readonly isBase64Encoding?: boolean;
    readonly mimeType?: string;
}

export class FileData implements IFileData {
    entityName!: string;
    entityId!: string;
    entityEtag!: string;
    entityFileExtensionType!: string;
    attributePath!: IAttributePath;
    isBase64Encoding: boolean | undefined;
    mimeType: string | undefined;

    public get getEntityName(): string { return this.entityName; }
    public get getEntityId(): string { return this.entityId; }
    public get getEntityEtag(): string { return this.entityEtag; }
    public get getEntityFileExtensionType(): string { return this.entityFileExtensionType; }
    public get getSaveAttributePath(): IAttributePath { return this.attributePath }
    public get hasBase64Encoding(): boolean | undefined { return this.isBase64Encoding }
    public get getMimeType(): string | undefined { return this.mimeType }

    constructor(
        entityId: string,
        entityName: string,
        entityEtag: string,
        entityFileExtensionType: string,
        attributePath: IAttributePath,
        useBase64Encoding?: boolean,
        mimeType?: string
    ) {
        this.entityId = entityId;
        this.entityName = entityName;
        this.entityEtag = entityEtag;
        this.entityFileExtensionType = entityFileExtensionType;
        this.attributePath = attributePath;
        this.isBase64Encoding = useBase64Encoding;
        this.mimeType = mimeType;
    }
}
