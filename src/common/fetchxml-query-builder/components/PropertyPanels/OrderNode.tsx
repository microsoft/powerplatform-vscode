/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState } from 'react';
import { IOrderNode } from '../../interfaces/Node';
import { EntityNode, LinkEntityNode, OrderNode } from '../../models/Node';
import { getVSCodeApi } from '../../utility/utility';
import { containerStyle, inputStyle, labelStyle, optionStyle, selectStyle } from './Styles';

export interface OrderNodePropertyPanelProps {
    node: IOrderNode;
    onPropertyUpdate: (updatedNode: IOrderNode) => void;
}

export const OrderNodePropertyPanel: React.FC<OrderNodePropertyPanelProps> = (props) => {
    const [attribute, setAttribute] = useState<string>(props.node.name);
    const [descending, setDescending] = useState<boolean>(props.node.descending ?? false);
    const [attributes, setAttributes] = useState<string[]>([]);
    const vscode = getVSCodeApi();

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

    const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'getAttributes') {
            setAttributes(event.data.attributes);
        }
    };

    React.useEffect(() => {
        window.addEventListener('message', messageHandler);
        const entityName = getEntityName(props.node);
        vscode.postMessage({ type: 'entitySelected', entity: entityName});

        return () => {
        window.removeEventListener('message', messageHandler);
        };
    }, [props.node]);

    return (
        <div style={{marginTop: '10px'}}>
            <div style={containerStyle}>
                <label htmlFor="dropdown" style={labelStyle}>Attribute Name:</label>
                <select id="dropdown" value={attribute} onChange={handleAttributeChange} style={selectStyle}>
                    {!attribute && <option value="" style={optionStyle}></option>}
                    {attributes.map(attribute => (
                        <option key={attribute} value={attribute} style={optionStyle}>
                            {attribute}
                        </option>
                    ))}
                </select>
            </div>
            {!attribute && <p style={{ color: 'red' }}>Please select an attribute name.</p>}
            <div style={containerStyle}>
                <label style={labelStyle}>Descending:</label>
                <input
                        type="checkbox"
                        checked={descending}
                        onChange={handleDescendingChange}
                        style={inputStyle}
                />
            </div>
        </div>
    );
}

const getEntityName = (node: IOrderNode): string | undefined => {
    if (node.parent instanceof EntityNode) {
        return (node.parent as EntityNode).name;
    }
    else if(node.parent instanceof LinkEntityNode) {
        return (node.parent as LinkEntityNode).name;
    }
    throw new Error('Invalid parent node type');
}
