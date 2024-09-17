/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NodeType } from "../constants/constants";
import { IEntityNode, IFetchNode, INode } from "../interfaces/Node";

export class Node implements INode {
    type: NodeType;
    id: string;
    children?: INode[];

    constructor(type: NodeType, label: string, id: string) {
        this.type = type;
        this.id = id;
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
}

export class FetchNode extends Node implements IFetchNode {
    entity: IEntityNode;
    top: number;
    distinct: boolean;

    constructor(entity: IEntityNode, top?: number, distinct?: boolean) {
        super(NodeType.Fetch, `Fetch top: ${top}`, 'fetch');
        this.entity = entity;
        this.top = top || 50;
        this.distinct = distinct || false;
        this.children = [entity];
    }

    getOpeningTag() {
        return `<fetch top="${this.top}" distinct="${this.distinct}">`;
    }

    getClosingTag() {
        return `</fetch>`;
    }

    getLabel() {
        return `Fetch top: ${this.top} distinct: ${this.distinct}`;
    }
}

export class EntityNode extends Node implements IEntityNode {
    name?: string;

    constructor(name?: string) {
        super(NodeType.Entity, `Entity: ${name}`, 'entity');
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
