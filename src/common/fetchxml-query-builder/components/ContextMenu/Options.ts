/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { INode } from "../../interfaces/Node";
import { addAttribute, addEntity, addLinkEntity, addOrder, deleteNode, moveDown, moveUp } from "./Actions/Actions";

export const Options = {
    'Entity': [
        {
            label: 'Add',
            subMenuItems: [
                {
                    label: 'Attribute',
                    action: (node: INode) => addAttribute(node),
                },
                {
                    label: 'Filter',
                },
                {
                    label: 'Order',
                    action: (node: INode) => addOrder(node),
                },
                {
                    label: 'Link Entity',
                    action : (node: INode) => addLinkEntity(node)
                }
            ]
        },
        {
            label: 'Delete',
            action: (node: INode) => deleteNode(node),

        },
        {
            label: 'Move Up',
            action: (node: INode) => moveUp(node),
        },
        {
            label: 'Move Down',
            action: (node: INode) => moveDown(node),
        },
    ],
    'Attribute': [
        {
            label: 'Delete',
            action: (node: INode) => deleteNode(node),

        },
        {
            label: 'Move Up',
            action: (node: INode) => moveUp(node),
        },
        {
            label: 'Move Down',
            action: (node: INode) => moveDown(node),
        }
    ],
    'Order': [
        {
            label: 'Delete',
            action: (node: INode) => deleteNode(node),

        },
        {
            label: 'Move Up',
            action: (node: INode) => moveUp(node),
        },
        {
            label: 'Move Down',
            action: (node: INode) => moveDown(node),
        }
    ],
    'LinkEntity': [
        {
            label: 'Delete',
            action: (node: INode) => deleteNode(node),

        },
        {
            label: 'Move Up',
            action: (node: INode) => moveUp(node),
        },
        {
            label: 'Move Down',
            action: (node: INode) => moveDown(node),
        }
    ],
    'Filter': [
        {
            label: 'Delete',
            action: (node: INode) => deleteNode(node),

        },
        {
            label: 'Move Up',
            action: (node: INode) => moveUp(node),
        },
        {
            label: 'Move Down',
            action: (node: INode) => moveDown(node),
        }
    ],
    'Fetch': [
        {
            label: 'Add',
            subMenuItems: [
                {
                    label: 'Entity',
                    action: (node: INode) => addEntity(node),
                }
            ]
        }
    ]
}
