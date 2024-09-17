/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as React from 'react';
import { INode } from '../interfaces/Node';

interface NodePropertyPanelProps {
    node: INode;
}

export const NodePropertyPanel: React.FC<NodePropertyPanelProps> = (props) => {
    return (
        <div>
            <h1>Node Property Panel</h1>
            {panelFactory(props.node)}
        </div>
    );
}

const panelFactory = (node: INode) => {
    switch (node.type) {
        default:
            return (
                <p>selected id: {node.id} & type:{node.type}</p>
            );
    }
}