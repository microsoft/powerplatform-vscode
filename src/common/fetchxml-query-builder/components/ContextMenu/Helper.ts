/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { INode } from "../../interfaces/Node";
import { addAttribute, addOrder } from "./Actions/Actions";

interface IMenuItem {
    label: string;
    action?: (node: INode) => void;
    subMenuItems?: IMenuItem[];
}

export const getMenuItems = (node: INode): IMenuItem[] => {
    switch (node.type) {
        case 'Entity':
            return [
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
                    ]
                },
                {
                    label: 'Delete',
                },
                {
                    label: 'Move Up',
                },
                {
                    label: 'Move Down'
                },
            ];
        default:
            return [];
    }
};