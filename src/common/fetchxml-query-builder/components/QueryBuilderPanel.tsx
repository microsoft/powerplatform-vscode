/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as React from 'react';
import { ITree } from '../interfaces/Tree';
import { INode } from '../interfaces/Node';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

interface QueryBuilderPanelProps {
    tree: ITree;
    onNodeSelect: (node: INode) => void;
}

export const QueryBuilderPanel: React.FC<QueryBuilderPanelProps> = (props) => {
    const nodes = [props.tree.root];
    return (
        <div>
            <h3>FetchXML Query Builder</h3>
            {renderTree(nodes, props.onNodeSelect)}
        </div>
    );
}

const renderTree = (nodes: INode[], onNodeSelect: (node: INode) => void) =>{
    return (
        <SimpleTreeView>
            {nodes.map((node) =>(
                <TreeItem itemId={node.id} label={node.label} onClick={() => onNodeSelect(node)}>
                    {node.children && renderTree(node.children, onNodeSelect)}
                </TreeItem>))}
        </SimpleTreeView>
    );
}