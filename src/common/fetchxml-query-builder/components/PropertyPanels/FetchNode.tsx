/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState } from 'react';
import { IFetchNode } from '../../interfaces/Node';
import { FetchNode } from '../../models/Node';

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
        const updatedNode = new FetchNode(props.node.entity, newTop, distinct);
        props.onPropertyUpdate(updatedNode);
    };

    const handleDistinctChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDistinct = event.target.checked;
        setDistinct(newDistinct);
        const updatedNode = new FetchNode(props.node.entity, top, newDistinct);
        props.onPropertyUpdate(updatedNode);
    };

    return (
        <div>
            <h3>Node Property Panel</h3>
            <label>
                Top:
                <input
                    type="number"
                    value={top}
                    onChange={handleTopChange}
                    min={0}
                />
            </label>
            <br></br>
            <label>
                Distinct:
                <input
                    type="checkbox"
                    checked={distinct}
                    onChange={handleDistinctChange}
                />
            </label>
        </div>
    );
}
