/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as React from 'react';
import { QueryBuilderPanel } from './QueryBuilderPanel';
import { NodePropertyPanel } from './NodePropertyPanel';
import { IEntityNode, IFetchNode, INode } from '../interfaces/Node';
import { ITree } from '../interfaces/Tree';
import { EntityNode, FetchNode } from '../models/Node';

export const FetchXmlQueryBuilderApp = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [tree, _] = React.useState<ITree>(getInitTree());
    const [selectedNode, setSelectedNode] = React.useState<INode>(tree.root);

    const onNodeSelect = (node: INode) => {
        setSelectedNode(node);
    }

    return (
        <div>
            <QueryBuilderPanel tree={tree} onNodeSelect={onNodeSelect}/>
            <NodePropertyPanel node={selectedNode}/>
        </div>
    );
}

const getInitTree = (): ITree => {
    const entityNode: IEntityNode = new EntityNode();
    const fetchNode: IFetchNode = new FetchNode(entityNode, 50);
    return {
        root: fetchNode
    };
}