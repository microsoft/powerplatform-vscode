/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NodeType } from "../constants/constants";
import { IEntityNode, IFetchNode, INode } from "../interfaces/Node";

export class Node implements INode {
    type: NodeType;
    label: string;
    id: string;
    children?: INode[];

    constructor(type: NodeType, label: string, id: string) {
        this.type = type;
        this.label = label;
        this.id = id;
    }

    get openingTag() {
        return '';
    }

    get closingTag() {
        return '';
    }
}

export class FetchNode extends Node implements IFetchNode {
    entity: IEntityNode;
    top: number;

    constructor(entity: IEntityNode, top: number) {
        super(NodeType.Fetch, `Fetch top: ${top}`, 'fetch');
        this.entity = entity;
        this.top = top;
        this.children = [entity];
    }

    get openingTag() {
        return `<fetch top="${this.top}">`;
    }

    get closingTag() {
        return `</fetch>`;
    }
}

export class EntityNode extends Node implements IEntityNode {
    name?: string;

    constructor(name?: string) {
        super(NodeType.Entity, `Entity: ${name}`, 'entity');
        this.name = name;
    }

    get openingTag() {
        return `<entity name="${this.name}">`;
    }

    get closingTag() {
        return `</entity>`;
    }
}
