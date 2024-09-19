/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState } from 'react';
import { IOrderNode } from '../../interfaces/Node';
import { OrderNode } from '../../models/Node';

export interface OrderNodePropertyPanelProps {
    node: IOrderNode;
    onPropertyUpdate: (updatedNode: IOrderNode) => void;
}

export const OrderNodePropertyPanel: React.FC<OrderNodePropertyPanelProps> = (props) => {
    const [attribute, setAttribute] = useState<string>(props.node.name);
    const [descending, setDescending] = useState<boolean>(props.node.descending ?? false);


    const attributes = ["name", "emailaddress1", "telephone1", "address1_city"];
    const handleAttributeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newAttribute = event.target.value;
        setAttribute(newAttribute);
        const updatedNode = new OrderNode(props.node.id, newAttribute, descending);
        props.onPropertyUpdate(updatedNode);
    };

    const handleDescendingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDescending = event.target.checked;
        setDescending(newDescending);
        const updatedNode = new OrderNode(props.node.id, attribute, newDescending);
        props.onPropertyUpdate(updatedNode);
    };

    return (
        <div>
            <label htmlFor="dropdown">Attribute Name:</label>
            <select id="dropdown" value={attribute} onChange={handleAttributeChange}>
                {!attribute && <option value=""></option>}
                {attributes.map(attribute => (
                    <option key={attribute} value={attribute}>
                        {attribute}
                    </option>
                ))}
            </select>
            {!attribute && <p style={{ color: 'red' }}>Please select an attribute name.</p>}
            <br></br>
            <label>
                Descending:
                <input
                    type="checkbox"
                    checked={descending}
                    onChange={handleDescendingChange}
                />
            </label>
        </div>
    );
}
