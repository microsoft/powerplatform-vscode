/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PortalSchema {
    entities: Entities;
  }
  export interface Entities {
    entity?: (Entity)[] | null;
    _xmlns: string;
  }
  export interface Entity {
    fields: Fields;
    relationships?: string | Relationships;
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
  }
  export interface Fields {
    field?: (FieldEntity)[] | null;
  }
  export interface FieldEntity {
    _displayname: string;
    _name: string;
    _type: string;
    _customfield?: string | null;
    _templateLocalize?: string | null;
    _updateCompare?: string | null;
    _primaryKey?: string | null;
    _lookupType?: string | null;
    _parentFieldName?: string | null;
    _fileType?: string | null;
    _localize?: string | null;
    _skipExport?: string | null;
  }
  export interface Relationships {
    relationship: Relationship;
  }
  export interface Relationship {
    _name: string;
    _manyToMany: string;
    _isreflexive: string;
    _relatedEntityName: string;
    _m2mTargetEntity: string;
    _m2mTargetEntityPrimaryKey: string;
  }

export class PortalSchemaProxy {
  public readonly entities: EntitiesProxy;
  public static Parse(d: string): PortalSchemaProxy {
    return PortalSchemaProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field = 'root'): PortalSchemaProxy {
    if (!field) {
      field = "root";
    }
    d.entities = EntitiesProxy.Create(d.entities, field + ".entities");
    return new PortalSchemaProxy(d);
  }
  private constructor(d: any) {
    this.entities = d.entities;
  }
}

export class EntitiesProxy {
  public readonly entity: EntityEntityProxy[] | null;
  public static Parse(d: string): EntitiesProxy {
    return EntitiesProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field = 'root'): EntitiesProxy {
    if (!field) {
      field = "root";
    }
    if (d.entity) {
      for (let i = 0; i < d.entity.length; i++) {
        d.entity[i] = EntityEntityProxy.Create(d.entity[i], field + ".entity" + "[" + i + "]");
      }
    }
    if (d.entity === undefined) {
      d.entity = null;
    }
     return new EntitiesProxy(d);
  }
  private constructor(d: any) {
    this.entity = d.entity;
  }
}

export class EntityEntityProxy {
  public readonly fields: FieldsProxy;
  public readonly relationships: string ;
  public readonly _name: string;
  public readonly _displayname: string;
  public readonly _etc: string | null;
  public readonly _primaryidfield: string;
  public readonly _primarynamefield: string;
  public readonly _disableplugins: string;
  public readonly _foldername: string;
  public readonly _propextension: string;
  public readonly _exporttype: string;
  public readonly _downloadThroughChild: string | null;
  public readonly _languagefield: string | null;
  public readonly _languagegroupby: string | null;
  public readonly _parententityname: string | null;
  public readonly _parententityfield: string | null;
  public readonly _orderby: string | null;
  public readonly _topcount: string | null;
  public readonly _syncdirection: string | null;
  public static Parse(d: string): EntityEntityProxy {
    return EntityEntityProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field = 'root'): EntityEntityProxy {
    if (!field) {
      field = "root";
    }
    d.fields = FieldsProxy.Create(d.fields, field + ".fields");
    return new EntityEntityProxy(d);
  }
  private constructor(d: any) {
    this.fields = d.fields;
    this.relationships = d.relationships;
    this._name = d._name;
    this._displayname = d._displayname;
    this._etc = d._etc;
    this._primaryidfield = d._primaryidfield;
    this._primarynamefield = d._primarynamefield;
    this._disableplugins = d._disableplugins;
    this._foldername = d._foldername;
    this._propextension = d._propextension;
    this._exporttype = d._exporttype;
    this._downloadThroughChild = d._downloadThroughChild;
    this._languagefield = d._languagefield;
    this._languagegroupby = d._languagegroupby;
    this._parententityname = d._parententityname;
    this._parententityfield = d._parententityfield;
    this._orderby = d._orderby;
    this._topcount = d._topcount;
    this._syncdirection = d._syncdirection;
  }
}

export class FieldsProxy {
  public readonly field: FieldEntityProxy[] | null;
  public static Parse(d: string): FieldsProxy {
    return FieldsProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field = 'root'): FieldsProxy {
    if (!field) {
      field = "root";
    }
    if (d.field) {
      for (let i = 0; i < d.field.length; i++) {
        d.field[i] = FieldEntityProxy.Create(d.field[i], field + ".field" + "[" + i + "]");
      }
    }
    return new FieldsProxy(d);
  }
  private constructor(d: any) {
    this.field = d.field;
  }
}

export class FieldEntityProxy {
  public readonly _displayname: string;
  public readonly _name: string;
  public readonly _type: string;
  public readonly _customfield: string | null;
  public readonly _templateLocalize: string | null;
  public readonly _updateCompare: string | null;
  public readonly _primaryKey: string | null;
  public readonly _lookupType: string | null;
  public readonly _parentFieldName: string | null;
  public readonly _fileType: string | null;
  public readonly _localize: string | null;
  public readonly _skipExport: string | null;
  public static Parse(d: string): FieldEntityProxy {
    return FieldEntityProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field = 'root'): FieldEntityProxy {
    if (!field) {
      field = "root";
    }
    return new FieldEntityProxy(d);
  }
  private constructor(d: any) {
    this._displayname = d._displayname;
    this._name = d._name;
    this._type = d._type;
    this._customfield = d._customfield;
    this._templateLocalize = d._templateLocalize;
    this._updateCompare = d._updateCompare;
    this._primaryKey = d._primaryKey;
    this._lookupType = d._lookupType;
    this._parentFieldName = d._parentFieldName;
    this._fileType = d._fileType;
    this._localize = d._localize;
    this._skipExport = d._skipExport;
  }
}
