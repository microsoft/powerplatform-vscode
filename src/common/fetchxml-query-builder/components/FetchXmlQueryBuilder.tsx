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
import { containerStyle, fetchXmlStyle, resizer, showQueryButton, sidebar, sidebarPanel } from './Styles';
import { getFetchXmlFromQueryTree, prettifyXml } from '../utility/utility';
import { ResultPanel } from './ResultPanel';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

export const FetchXmlQueryBuilderApp = () => {
    const [tree, setTree] = React.useState<ITree>(getInitTree());
    const [fetchXml, setFetchXml] = React.useState<string>('');
    const [selectedNode, setSelectedNode] = React.useState<INode>(tree.root);
    const [sidebarWidth, setSidebarWidth] = React.useState<number>(300);
    const isResizing = React.useRef(false);

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

    const showQuery = () => {
        let query = getFetchXmlFromQueryTree(tree);
        query = prettifyXml(query);
        setFetchXml(query);
    };

    const handleMouseDown = (_: React.MouseEvent) => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = e.clientX;
        if (newWidth > 200 && newWidth < 600) { // Sidebar width limits
            setSidebarWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div style={containerStyle}>
            <div style={{...sidebar, width: sidebarWidth}}>
                <button style={showQueryButton} onClick={showQuery}>
                    <AddBoxOutlinedIcon style={{ marginRight: '8px' }}/>
                    <span>Show Query</span>
                </button>
                <QueryBuilderPanel
                    tree={tree}
                    style={{...sidebarPanel, borderBottom: '0.5px solid #cccccc'}}
                    onNodeSelect={onNodeSelect}
                    refreshTree={refreshTree}
                />
                <NodePropertyPanel
                    node={selectedNode}
                    onPropertyUpdate={onPropertyUpdate}
                    style={{...sidebarPanel,marginTop: '10px', borderBottom: '0.5px solid #cccccc'}}/>
                 {/* <ChatInput
                    style={sidebarPanel as React.CSSProperties}
                 /> */}
            </div>
            <div
                style={resizer}
                onMouseDown={handleMouseDown}
            />
            <div style={fetchXmlStyle}>
                <ResultPanel query={fetchXml} />
            </div>
        </div>
    );
}

const updateNodeInTree = (currentNode: INode, newNode: INode): INode => {
    if (currentNode.id === newNode.id) {
        return newNode;
    }

    if (currentNode.getChildren()) {
        currentNode.setChildren(currentNode.getChildren().map(childNode =>
            updateNodeInTree(childNode, newNode)
        ));
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
