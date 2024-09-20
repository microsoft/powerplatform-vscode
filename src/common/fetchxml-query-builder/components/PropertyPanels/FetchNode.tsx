/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState } from 'react';
import { IFetchNode } from '../../interfaces/Node';
import { FetchNode } from '../../models/Node';
import { containerStyle, labelStyle, propertyNode } from './Styles';

export interface FetchNodePropertyPanelProps {
    node: IFetchNode;
    onPropertyUpdate: (updatedNode: IFetchNode) => void;
}

export const FetchNodePropertyPanel: React.FC<FetchNodePropertyPanelProps> = (props) => {
    const [top, setTop] = useState<number>(props.node.top);
    const [distinct, setDistinct] = useState<boolean>(props.node.distinct);

    const handleTopChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newTop = Number(event.target.value);
        setTop(newTop);
        const updatedNode = new FetchNode(props.node.getEntity(), newTop, distinct);
        props.onPropertyUpdate(updatedNode);
    };

    const handleDistinctChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDistinct = event.target.checked;
        setDistinct(newDistinct);
        const updatedNode = new FetchNode(props.node.getEntity(), top, newDistinct);
        props.onPropertyUpdate(updatedNode);
    };

    return (
        <div style={propertyNode}>
            <div style={containerStyle}>
                <label style={labelStyle}>Top:</label>
                <input
                    type="number"
                    value={top}
                    onChange={handleTopChange}
                    min={0}
                />
            </div>
            <div style={containerStyle}>
                <label style={labelStyle}>Distinct:</label>
                <input
                    type="checkbox"
                    checked={distinct}
                    onChange={handleDistinctChange}
                />
            </div>
            {!props.node.getEntity() && <p style={{ color: 'red' }}>Please add an entity under fetch.</p>}
        </div>
    );
}
