/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState } from "react";
import { IAttributeNode } from "../../interfaces/Node";
import { AttributeNode} from "../../models/Node";
import { getVSCodeApi } from "../../utility/utility";
import { containerStyle, labelStyle, optionStyle, selectStyle } from "./Styles";

export interface AttributeNodePropertyPanelProps {
    node: IAttributeNode;
    onPropertyUpdate: (updatedNode: IAttributeNode) => void;
}

export const AttributeNodePropertyPanel: React.FC<AttributeNodePropertyPanelProps> = (props) => {
    const [selectedAttribute, setSelectedAttribute] = useState(props.node.name);
    const [attributes, setAttributes] = useState<string[]>([]);
    const vscode = getVSCodeApi();

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAttribute(event.target.value);
        const updateNode = new AttributeNode(props.node.id, event.target.value);
        props.onPropertyUpdate(updateNode);
    };

    const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'getAttributes') {
            console.log(event.data.attributes);
            setAttributes(event.data.attributes);
        }
    };

    React.useEffect(() => {
        window.addEventListener('message', messageHandler);

        // Request attributes for the selected entity
        vscode.postMessage({ type: 'entitySelected', entity: ''});

        return () => {
        window.removeEventListener('message', messageHandler);
        };
    }, [messageHandler]);


    return (
        <div style={{...containerStyle, marginTop: '10px'} }>
            <label htmlFor="dropdown" style={labelStyle}>Attribute Name:</label>
            <select id="dropdown"
                value={selectedAttribute}
                onChange={handleChange}
                style={selectStyle}
            >
                {!selectedAttribute && <option value="" style={optionStyle}></option>}
                {attributes.map(attribute => (
                    <option key={attribute} value={attribute} style={optionStyle}>
                        {attribute}
                    </option>
                ))}
            </select>
        </div>
    )
}
