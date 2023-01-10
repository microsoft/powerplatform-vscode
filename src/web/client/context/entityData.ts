/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface IEntityData {
    entityName: string,
    entityId: string,
    entityEtag: string,
    entityColumn: Map<string, string>
}

export class EntityData implements IEntityData {
    private _entityName!: string;
    private _entityId!: string;
    private _entityEtag!: string;
    private _entityColumn!: Map<string, string>;

    public get entityName(): string { return this._entityName; }
    public get entityId(): string { return this._entityId; }
    public get entityEtag(): string { return this._entityEtag; }
    public get entityColumn(): Map<string, string> { return this._entityColumn; }

    constructor(
        entityId: string,
        entityName: string,
        entityEtag: string,
        entityColumn: Map<string, string>
    ) {
        this._entityId = entityId;
        this._entityName = entityName;
        this._entityEtag = entityEtag;
        this._entityColumn = entityColumn;
    }
}
