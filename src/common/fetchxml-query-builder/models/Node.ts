/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { FilterType, NodeType } from "../constants/constants";
import { IAttributeNode, IEntityNode, IFetchNode, IFilterNode, ILinkEntityNode, INode, IOrderNode } from "../interfaces/Node";

export class Node implements INode {
    type: NodeType;
    id: string;
    _children: INode[];
    parent: INode | null;

    constructor(type: NodeType, id: string) {
        this.type = type;
        this.id = id;
        this._children = [];
        this.parent = null;
    }

    getOpeningTag() {
        return '';
    }

    getClosingTag() {
        return '';
    }

    getLabel() {
        return this.id;
    }

    getChildren() {
        return this._children;
    }

    addChild(node: INode) {
        this._children.push(node);
        node.parent = this;
    }

    setChildren(children: INode[]) {
        this._children = children;
        for (const child of children) {
            child.parent = this;
        }
    }
}

export class FetchNode extends Node implements IFetchNode {
    top: number;
    distinct: boolean;

    constructor(entity: IEntityNode|null, top?: number, distinct?: boolean) {
        super(NodeType.Fetch, 'fetch');
        this.top = top || 50;
        this.distinct = distinct || false;
        this._children = entity ? [entity] : [];
        if (entity) {
            entity.parent = this;
        }
    }

    getOpeningTag() {
        return `<fetch distinct="${this.distinct}">`;
    }

    getClosingTag() {
        return `</fetch>`;
    }

    getLabel() {
        return `Fetch distinct: ${this.distinct}`;
    }

    getEntity() {
        if (!this._children) return null;

        return this._children[0] as IEntityNode;
    }

    setEntity(entity: IEntityNode) {
        this._children = [entity];
        entity.parent = this;
    }
}

export class EntityNode extends Node implements IEntityNode {
    name?: string;

    constructor(name?: string) {
        super(NodeType.Entity, 'entity');
        this.name = name;
    }

    getOpeningTag() {
        return `<entity name="${this.name}">`;
    }

    getClosingTag() {
        return `</entity>`;
    }

    getLabel() {
        return `Entity: ${this.name}`;
    }
}

export class AttributeNode extends Node implements IAttributeNode {
    name?: string;

    constructor(id: string, name?: string ) {
        super(NodeType.Attribute, id);
        this.name = name;
    }

    getOpeningTag() {
        return `<attribute name="${this.name}" />`;
    }

    getClosingTag() {
        return '';
    }

    getLabel() {
        return `Attribute: ${this.name}`;
    }
}


//<order attribute="adx_mimetype" descending="true" />
// default value of descending is false if not provided
export class OrderNode extends Node implements IOrderNode {
    name: string;
    descending: boolean;

    constructor(id: string, attribute?: string, descending?: boolean) {
        super(NodeType.Order, id);
        this.name = attribute || '';
        this.descending = descending || false;
    }

    getOpeningTag() {
        return `<order attribute="${this.name}" descending="${this.descending}" />`;
    }

    getClosingTag() {
        return '';
    }

    getLabel() {
        return `Order: ${this.name}`;
    }
}
export class LinkEntityNode extends Node implements ILinkEntityNode {
    name?: string;
    relationship?: string;
    joinType?: string;
    alias?: string;
    linkEntities?: ILinkEntityNode[];
    attributes?: IAttributeNode[];
    from?: string;
    to?: string;

    constructor(id: string, name?: string, relationship?: string, joinType?: string, alias?: string, from?: string, to?: string, linkEntities?: ILinkEntityNode[], attributes?: IAttributeNode[]) {
        super(NodeType.LinkEntity, id);
        this.name = name;
        this.relationship = relationship;
        this.joinType = joinType;
        this.alias = alias;
        this.from = from;
        this.to = to;
        this.linkEntities = linkEntities || [];
        this.attributes = attributes || [];
    }

    getOpeningTag() {
        return `<link-entity name="${this.name}" from="${this.from}" to="${this.to}" link-type="${this.joinType}" alias="${this.alias}">`;
    }

    getClosingTag() {
        return `</link-entity>`;
    }

    getLabel() {
        return `Link Entity: ${this.name}`;
    }
}

export class FilterNode extends Node implements IFilterNode {
    filterType: FilterType;

    constructor(id: string, filterType: FilterType) {
        super(NodeType.Filter, id);
        this.filterType = filterType;
    }

    getOpeningTag() {
        return `<filter type="${this.filterType}">`;
    }

    getClosingTag() {
        return `</filter>`;
    }

    getLabel() {
        return `Filter: ${this.filterType}`;
    }
}
