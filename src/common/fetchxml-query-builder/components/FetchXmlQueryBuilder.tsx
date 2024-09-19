/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as React from 'react';
import { QueryBuilderPanel } from './QueryBuilderPanel';
import { NodePropertyPanel } from './NodePropertyPanel';
import { IAttributeNode, IEntityNode, IFetchNode, INode, IOrderNode } from '../interfaces/Node';
import { ITree } from '../interfaces/Tree';
import { AttributeNode, EntityNode, FetchNode, OrderNode } from '../models/Node';

export const FetchXmlQueryBuilderApp = () => {
    const [tree, setTree] = React.useState<ITree>(getInitTree());
    const [selectedNode, setSelectedNode] = React.useState<INode>(tree.root);

    const onNodeSelect = (node: INode) => {
        setSelectedNode(node);
    }

    const onPropertyUpdate = (updatedNode: INode) => {
        if (updatedNode.id === tree.root.id) {
            setTree({root: updatedNode});
        } else {
            setTree({root: updateNodeInTree(tree.root, updatedNode)});
        }
    }

    const addAttributeNode = (entityNode: IEntityNode, attributeName: string, id: string) => {
        const newAttributeNode = new AttributeNode(attributeName, id);
        entityNode.children = [...(entityNode.children || []), newAttributeNode];
        setTree({root: updateNodeInTree(tree.root, entityNode)});
    }

    const removeAttributeNode = (entityNode: IEntityNode, attributeId: string) => {
        entityNode.children = (entityNode.children || []).filter(child => child.id !== attributeId);
        setTree({root: updateNodeInTree(tree.root, entityNode)});
    }

    return (
        <div>
            <QueryBuilderPanel
                tree={tree}
                onNodeSelect={onNodeSelect}
                addAttributeNode={addAttributeNode}
                removeAttributeNode={removeAttributeNode}
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
    const attributeNodes: IAttributeNode[] = [
        new AttributeNode('attribute1', 'attribute-1'),
        new AttributeNode('attribute2', 'attribute-2'),
        new AttributeNode('attribute3', 'attribute-3')
    ];
    const orderNodes: IOrderNode[] = [
        new OrderNode('order1', 'order1', false),
        new OrderNode('order2', 'order2', true)
    ];

    entityNode.children = [...attributeNodes, ...orderNodes];
    const fetchNode: IFetchNode = new FetchNode(entityNode, 50);
    return {
        root: fetchNode
    };
}
