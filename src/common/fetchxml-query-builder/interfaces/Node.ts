/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { FilterType, NodeType } from "../constants/constants";

export interface INode {
    type: NodeType;
    id: string;
    getOpeningTag: () => string;
    getClosingTag: () => string;
    getLabel: () => string;
    addChild: (node: INode) => void;
    getChildren: () => INode[];
    setChildren: (children: INode[]) => void;
    parent: INode | null;
}

export interface IEntityNode extends INode {
    name?: string;
    attributes?: IAttributeNode[];
}

export interface IFetchNode extends INode {
    getEntity: () => IEntityNode | null;
    top: number;
    distinct: boolean;
}
export interface IAttributeNode extends INode {
    name?: string;
}

export interface IOrderNode extends INode {
    name: string;
    descending?: boolean;
}

export interface ILinkEntityNode extends INode {
    name?: string;
    relationship?: string;
    joinType?: string;
    alias?: string;
    linkEntities?: ILinkEntityNode[];
    attributes?: IAttributeNode[];
    from?: string;
    to?: string;
}

export interface IFilterNode extends INode {
    filterType: FilterType;
}

export interface IConditionNode extends INode {
    attribute?: string;
    operator?: string;
    value?: string;
}