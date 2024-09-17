/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NodeType } from "../constants/constants";

export interface INode {
    type: NodeType;
    label: string;
    id: string;
    openingTag: string;
    closingTag: string;
    children?: INode[];
}

export interface IEntityNode extends INode {
    name?: string;
}

export interface IFetchNode extends INode {
    entity: IEntityNode;
    top: number;
}