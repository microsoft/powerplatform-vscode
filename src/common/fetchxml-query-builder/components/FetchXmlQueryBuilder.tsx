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
    const [tree, setTree] = React.useState<ITree>(getInitTree());
    const [selectedNode, setSelectedNode] = React.useState<INode>(tree.root);

    const onNodeSelect = (node: INode) => {
        setSelectedNode(node);
    }

    const refreshTree = () => {
        setTree({root: tree.root});
    };

    const onPropertyUpdate = (updatedNode: INode) => {
        if (updatedNode.id === tree.root.id) {
            setTree({root: updatedNode});
        } else {
            setTree({root: updateNodeInTree(tree.root, updatedNode)});
        }
    }

    return (
        <div>
            <QueryBuilderPanel
                tree={tree}
                onNodeSelect={onNodeSelect}
                refreshTree={refreshTree}
            />
            <NodePropertyPanel node={selectedNode} onPropertyUpdate={onPropertyUpdate}/>
        </div>
    );
}

const updateNodeInTree = (currentNode: INode, newNode: INode): INode => {
    if (currentNode.id === newNode.id) {
        return newNode;
    }

    if (currentNode.children) {
        currentNode.children = currentNode.children.map(childNode =>
            updateNodeInTree(childNode, newNode)
        );
    }

    return currentNode;
}

const getInitTree = (): ITree => {
    const entityNode: IEntityNode = new EntityNode();

    const fetchNode: IFetchNode = new FetchNode(entityNode, 50);
    return {
        root: fetchNode
    };
}
