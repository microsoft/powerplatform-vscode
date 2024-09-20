/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as React from 'react';
import { ITree } from '../interfaces/Tree';
import { INode } from '../interfaces/Node';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { ContextMenu } from './ContextMenu/ContextMenu';

interface QueryBuilderPanelProps {
    tree: ITree;
    onNodeSelect: (node: INode) => void;
    refreshTree: () => void;
}

export const QueryBuilderPanel: React.FC<QueryBuilderPanelProps> = (props) => {
    const [contextMenuVisible, setContextMenuVisible] = React.useState(false);
    const [menuPosition, setMenuPosition] = React.useState({ x: 0, y: 0 });
    const [selectedNode, setSelectedNode] = React.useState<INode | null>(null);
    const nodes = [props.tree.root];

    React.useEffect(() => {
        const handleClickOutside = () => {
          if (contextMenuVisible) setContextMenuVisible(false);
        };
        window.addEventListener("click", handleClickOutside);
    
        return () => {
          window.removeEventListener("click", handleClickOutside);
        };
      }, [contextMenuVisible, selectedNode]);

    const handleContextMenu = (e: React.MouseEvent, node: INode) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuVisible(true);
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setSelectedNode(node);
    };

    return (
        <div>
            <h3>FetchXML Query Builder</h3>
            {renderTree(nodes, props.onNodeSelect, handleContextMenu)}
            {contextMenuVisible 
                && selectedNode 
                && (<ContextMenu 
                        position={menuPosition} 
                        node={selectedNode}
                        refreshTree={props.refreshTree}
                    />)
            }
        </div>
    );
}

const renderTree = (nodes: INode[], onNodeSelect: (node: INode) => void, onContextMenu: (e: React.MouseEvent, node: INode) => void) =>{
    if (nodes.length === 0) return null;
    return (
        <SimpleTreeView>
            {nodes.map((node) =>(
                <TreeItem
                    key={node.id}
                    itemId={node.id}
                    label={node.getLabel()}
                    onClick={() => onNodeSelect(node)}
                    onContextMenu={(e) => onContextMenu(e, node)}
                >
                    {node.getChildren() && renderTree(node.getChildren(), onNodeSelect, onContextMenu)}
                </TreeItem>))}
        </SimpleTreeView>
    );
}
