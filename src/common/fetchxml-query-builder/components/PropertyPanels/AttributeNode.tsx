/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState } from "react";
import { IAttributeNode } from "../../interfaces/Node";
import { AttributeNode} from "../../models/Node";

export interface AttributeNodePropertyPanelProps {
    node: IAttributeNode;
    onPropertyUpdate: (updatedNode: IAttributeNode) => void;
}

export const AttributeNodePropertyPanel: React.FC<AttributeNodePropertyPanelProps> = (props) => {
    const [selectedAttribute, setSelectedAttribute] = useState(props.node.name);

    const attributes = ["name", "emailaddress1", "telephone1", "address1_city"];
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAttribute(event.target.value);
        const updateNode = new AttributeNode(event.target.value, props.node.id);
        props.onPropertyUpdate(updateNode);
    };

    return (
        <div>
            <label htmlFor="dropdown">Attribute Name:</label>
            <select id="dropdown" value={selectedAttribute} onChange={handleChange}>
                {!selectedAttribute && <option value=""></option>}
                {attributes.map(attribute => (
                    <option key={attribute} value={attribute}>
                        {attribute}
                    </option>
                ))}
            </select>
            {!selectedAttribute && <p style={{ color: 'red' }}>Please select an attribute name.</p>}
        </div>
    )
}
