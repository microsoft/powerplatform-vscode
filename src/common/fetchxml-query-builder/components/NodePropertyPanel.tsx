/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as React from 'react';
import { INode } from '../interfaces/Node';
import { NodeType } from '../constants/constants';
import { FetchNodePropertyPanel } from './PropertyPanels/FetchNode';
import { AttributeNode, ConditionNode, EntityNode, FetchNode, FilterNode, OrderNode } from '../models/Node';
import { EntityNodePropertyPanel } from './PropertyPanels/EntityNode';
import { AttributeNodePropertyPanel } from './PropertyPanels/AttributeNode';
import { OrderNodePropertyPanel } from './PropertyPanels/OrderNode';
import LinkEntityNodePropertyPanel from './PropertyPanels/LinkEntityNode';
import { FilterNodePropertyPanel } from './PropertyPanels/FilterNode';
import { ConditionNodePropertyPanel } from './PropertyPanels/ConditionNode';

interface NodePropertyPanelProps {
    node: INode;
    onPropertyUpdate: (updatedNode: INode) => void;
    style?: React.CSSProperties;
}

export const NodePropertyPanel: React.FC<NodePropertyPanelProps> = (props) => {
    return (
        <div style={props.style}>
            <span>Node Properties</span>
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
        case NodeType.Entity:
            return (
                <EntityNodePropertyPanel
                    node={node as EntityNode}
                    onPropertyUpdate={onPropertyUpdate}/>
            );
        case NodeType.Attribute:
            return (
                <AttributeNodePropertyPanel
                    node={node as AttributeNode}
                    onPropertyUpdate={onPropertyUpdate}/>
            );
        case NodeType.Order:
            return (
                <OrderNodePropertyPanel
                    node={node as OrderNode}
                    onPropertyUpdate={onPropertyUpdate}/>
            );
        case NodeType.LinkEntity:
            return (
                <LinkEntityNodePropertyPanel
                    node={node as EntityNode}
                    onPropertyUpdate={onPropertyUpdate}/>
            );
        case NodeType.Filter:
            return (
                <FilterNodePropertyPanel
                    node={node as FilterNode}
                    onPropertyUpdate={onPropertyUpdate}/>
            );
        case NodeType.Condition:
            return (
                <ConditionNodePropertyPanel
                    node={node as ConditionNode}
                    onPropertyUpdate={onPropertyUpdate}/>
            );
        default:
            return (
                <p>selected id: {node.id} & type:{node.type}</p>
            );
    }
}
