/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface Entities {
    entity?: (Entity)[] | null;
}
export interface Entity {
    _name: string;
    _displayname: string;
    _etc?: string | null;
    _primaryidfield: string;
    _primarynamefield: string;
    _disableplugins: string;
    _foldername: string;
    _propextension: string;
    _exporttype: string;
    _downloadThroughChild?: string | null;
    _languagefield?: string | null;
    _languagegroupby?: string | null;
    _parententityname?: string | null;
    _parententityfield?: string | null;
    _orderby?: string | null;
    _topcount?: string | null;
    _syncdirection?: string | null;
    _fetchQueryParameters?: string | null;
    _attributes?: string | null;
}

export interface WebsiteDetails {
    adx_website_language: string,
    adx_name: string
}

export interface ISaveEntityDetails {
    readonly entityName: string,
    readonly entityId: string,
    readonly saveAttribute: string,
    readonly useBase64Encoding: boolean;
}

export class SaveEntityDetails implements ISaveEntityDetails {
    entityName!: string;
    entityId!: string;
    saveAttribute!: string;
    useBase64Encoding: boolean;
    public get getEntityName(): string { return this.entityName; }
    public get getEntityId(): string { return this.entityId; }
    public get getSaveAttribute(): string { return this.saveAttribute }
    public get getUseBase64Encoding(): boolean { return this.useBase64Encoding }
    constructor(entityId: string, entityName: string, saveAttribute: string, useBase64Encoding: boolean) {
        this.entityId = entityId;
        this.entityName = entityName;
        this.saveAttribute = saveAttribute;
        this.useBase64Encoding = useBase64Encoding;
    }
}
