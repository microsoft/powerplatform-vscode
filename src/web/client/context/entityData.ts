/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IEntityInfo } from "../common/interfaces";

export interface IEntityData extends IEntityInfo {
    entityEtag: string;
    entityColumn: Map<string, string>;
    mappingEntityId?: string;
}

export class EntityData implements IEntityData {
    private _entityName!: string;
    private _entityId!: string;
    private _entityEtag!: string;
    private _entityColumn!: Map<string, string>;
    private _mappingEntityId?: string;

    public get entityName(): string {
        return this._entityName;
    }
    public get entityId(): string {
        return this._entityId;
    }
    public get entityEtag(): string {
        return this._entityEtag;
    }
    public get entityColumn(): Map<string, string> {
        return this._entityColumn;
    }
    public get mappingEntityId(): string | undefined {
        return this._mappingEntityId;
    }

    // Setters
    public set setEntityEtag(value: string) {
        this._entityEtag = value;
    }

    constructor(
        entityId: string,
        entityName: string,
        entityEtag: string,
        entityColumn: Map<string, string>,
        mappingEntityId?: string
    ) {
        this._entityId = entityId;
        this._entityName = entityName;
        this._entityEtag = entityEtag;
        this._entityColumn = entityColumn;
        this._mappingEntityId = mappingEntityId;
    }
}
