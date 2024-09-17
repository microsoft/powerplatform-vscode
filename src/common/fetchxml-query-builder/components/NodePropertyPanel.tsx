/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as React from 'react';
import { INode } from '../interfaces/Node';
import { NodeType } from '../constants/constants';
import { FetchNodePropertyPanel } from './PropertyPanels/FetchNode';
import { FetchNode } from '../models/Node';

interface NodePropertyPanelProps {
    node: INode;
    onPropertyUpdate: (updatedNode: INode) => void;
}

export const NodePropertyPanel: React.FC<NodePropertyPanelProps> = (props) => {
    return (
        <div>
            <h3>Node Property Panel</h3>
            {panelFactory(props.node, props.onPropertyUpdate)}
        </div>
    );
}

const panelFactory = (node: INode, onPropertyUpdate: (updatedNode: INode) => void) => {
    switch (node.type) {
        case NodeType.Fetch:
            return (
                <FetchNodePropertyPanel 
                    node={node as FetchNode} 
                    onPropertyUpdate={onPropertyUpdate}/>
            );
        default:
            return (
                <p>selected id: {node.id} & type:{node.type}</p>
            );
    }
}