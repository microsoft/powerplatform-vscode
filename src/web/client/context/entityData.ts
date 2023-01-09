/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface IEntityData {
    readonly entityName: string,
    readonly entityId: string,
}

export class EntityData implements IEntityData {
    entityName!: string;
    entityId!: string;
    entityEtag!: string;
    entityColumn!: Map<string, string>;

    public get getEntityName(): string { return this.entityName; }
    public get getEntityId(): string { return this.entityId; }
    public get getEntityEtag(): string { return this.entityEtag; }
    public get getColumn(): Map<string, string> { return this.entityColumn; }

    constructor(
        entityId: string,
        entityName: string,
        entityEtag: string,
        entityColumn: Map<string, string>
    ) {
        this.entityId = entityId;
        this.entityName = entityName;
        this.entityEtag = entityEtag;
        this.entityColumn = entityColumn;
    }
}
