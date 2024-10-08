/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { INode } from "../../interfaces/Node";
import { Options } from "./Options";

interface IMenuItem {
    label: string;
    action?: (node: INode) => void;
    subMenuItems?: IMenuItem[];
}

export const getMenuItems = (node: INode): IMenuItem[] => {
    switch (node.type) {
        case 'Entity':
        case 'Attribute':
        case 'LinkEntity':
        case 'Order':
        case 'Filter':
        case 'Condition':
            return Options[node.type];
        case 'Fetch':
            if (node.getChildren().length > 0) {
                return Options[node.type].filter(item => item.label !== 'Add');
            }
            return Options[node.type];
        default:
            return [];
    }
};
