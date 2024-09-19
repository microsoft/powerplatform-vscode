/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as React from 'react';
import { ITree } from '../interfaces/Tree';
import { IEntityNode, INode } from '../interfaces/Node';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { EntityNode } from '../models/Node';

interface QueryBuilderPanelProps {
    tree: ITree;
    onNodeSelect: (node: INode) => void;
    addAttributeNode: (entityNode: IEntityNode, attributeName: string, id: string) => void;
    removeAttributeNode: (entityNode: IEntityNode, attributeId: string) => void;
}

export const QueryBuilderPanel: React.FC<QueryBuilderPanelProps> = (props) => {
    const nodes = [props.tree.root];

    const handleAddAttribute = () => {
        if (props.tree.root instanceof EntityNode) {
            const uniqueId = `attribute-${Date.now()}`;
            props.addAttributeNode(props.tree.root as IEntityNode, 'newAttribute', uniqueId);
        }
    };

    const handleRemoveAttribute = () => {
        if (props.tree.root instanceof EntityNode) {
            props.removeAttributeNode(props.tree.root as IEntityNode, 'attribute-newAttribute');
        }
    };

    return (
        <div>
            <h3>FetchXML Query Builder</h3>
            {renderTree(nodes, props.onNodeSelect)}
            <button onClick={handleAddAttribute}>Add Attribute</button>
            <button onClick={handleRemoveAttribute}>Remove Attribute</button>
        </div>
    );
}

const renderTree = (nodes: INode[], onNodeSelect: (node: INode) => void) =>{
    return (
        <SimpleTreeView>
            {nodes.map((node) =>(
                <TreeItem itemId={node.id} label={node.getLabel()} onClick={() => onNodeSelect(node)}>
                    {node.children && renderTree(node.children, onNodeSelect)}
                </TreeItem>))}
        </SimpleTreeView>
    );
}
