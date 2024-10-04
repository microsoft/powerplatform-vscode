/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { AttributeNode, EntityNode, FilterNode, LinkEntityNode, OrderNode } from "../../../models/Node";
import { INode } from "../../../interfaces/Node";
import { generateId } from "../../../utility/utility";
import { FilterType } from "../../../constants/constants";

export const addAttribute = (node: INode) => {
    const attribute = new AttributeNode(generateId());
    node.addChild(attribute);
}

export const addOrder = (node: INode) => {
    const attribute = new OrderNode(generateId());
    node.addChild(attribute);
}

export const addLinkEntity = (node: INode) => {
    const linkEntity = new LinkEntityNode(generateId());
    node.addChild(linkEntity);
}

export const addFilter = (node: INode) => {
    const filter = new FilterNode(generateId(), FilterType.And);
    node.addChild(filter);
}

export const addEntity = (node: INode) => {
    const entity = new EntityNode();
    node.addChild(entity);
}
export const deleteNode = (node: INode) => {
    node.parent?.setChildren(node.parent.getChildren().filter(child => child.id !== node.id));
    node.parent = null;
}

export const moveUp = (node: INode) => {
    const siblings = node.parent?.getChildren();
    const index = siblings?.findIndex(child => child.id === node.id);
    if (index && index > 0 && siblings) {
        const temp = siblings[index - 1];
        siblings[index - 1] = node;
        siblings[index] = temp;
        node.parent?.setChildren(siblings);
    }
}

export const moveDown = (node: INode) => {
    const siblings = node.parent?.getChildren();
    const index = siblings?.findIndex(child => child.id === node.id);
    if (index != undefined && index!= null && siblings && index < siblings?.length - 1) {
        const temp = siblings[index + 1];
        siblings[index + 1] = node;
        siblings[index] = temp;
        node.parent?.setChildren(siblings);
    }
}
