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
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import { NodeType } from '../constants/constants';
import { BackupTableRounded, CommitRounded, SwapVertRounded } from '@mui/icons-material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';

interface QueryBuilderPanelProps {
    tree: ITree;
    onNodeSelect: (node: INode) => void;
    refreshTree: () => void;
    style: React.CSSProperties;
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
        <div style={props.style}>
            <span>Query Builder</span>
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
        <div style={{marginTop:'5px'}}>
            <SimpleTreeView>
            {nodes.map((node) =>(
                <TreeItem
                    key={node.id}
                    itemId={node.id}
                    label={getNodeLabel(node)}
                    onClick={() => onNodeSelect(node)}
                    onContextMenu={(e) => onContextMenu(e, node)}
                >
                    {node.getChildren() && renderTree(node.getChildren(), onNodeSelect, onContextMenu)}
                </TreeItem>))}
            </SimpleTreeView>
        </div>
    );
}

const getNodeLabel = (node: INode) => {
    switch (node.type) {
        case NodeType.Entity:
            return(
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                    <BackupTableRounded style={{marginRight: '5px', fontSize: '15px'}}/>
                    {node.getLabel()}
                </div>
            );
        case NodeType.Attribute:
            return (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                    <CommitRounded style={{marginRight: '5px', fontSize: '15px'}}/>
                    {node.getLabel()}
                </div>
            );
        case NodeType.Fetch:
            return (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                    <StorageRoundedIcon style={{marginRight: '5px', fontSize: '15px'}}/>
                    {node.getLabel()}
                </div>
            );
        case NodeType.Order:
            return (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                    <SwapVertRounded style={{marginRight: '5px', fontSize: '15px'}}/>
                    {node.getLabel()}
                </div>
            );
        case NodeType.LinkEntity:
            return (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                    <StorageRoundedIcon style={{marginRight: '5px', fontSize: '15px'}}/>
                    {node.getLabel()}
                </div>
            );
        case NodeType.Filter:
            return (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                    <FilterAltOutlinedIcon style={{marginRight: '5px', fontSize: '15px'}}/>
                    {node.getLabel()}
                </div>
            );
        default:
            return '';
    }
}
