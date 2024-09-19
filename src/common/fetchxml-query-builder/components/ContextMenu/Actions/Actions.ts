/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { AttributeNode, OrderNode } from "../../../models/Node";
import { INode } from "../../../interfaces/Node";
import { generateId } from "../../../utility/utility";

export const addAttribute = (node: INode) => {
    const attribute = new AttributeNode(generateId());
    node.children.push(attribute);
}

export const addOrder = (node: INode) => {
    const attribute = new OrderNode(generateId());
    node.children.push(attribute);
}