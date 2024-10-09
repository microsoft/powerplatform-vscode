/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState } from "react";
import { IConditionNode } from "../../interfaces/Node";
import { containerStyle, inputStyle, labelStyle, optionStyle, propertyNode, selectStyle } from "./Styles";
import { ConditionNode, EntityNode, LinkEntityNode } from "../../models/Node";
import { getVSCodeApi } from "../../utility/utility";

export interface ConditionNodePropertyPanelProps {
    node: IConditionNode;
    onPropertyUpdate: (updatedNode: IConditionNode) => void;
}

export const ConditionNodePropertyPanel: React.FC<ConditionNodePropertyPanelProps> = (props) => {
    const operators = ['eq', 'ne'];
    const [selectedAttribute, setSelectedAttribute] = useState(props.node.attribute);
    const [selectedOperator, setSelectedOperator] = useState(props.node.operator);
    const [selectedValue, setSelectedValue] = useState(props.node.value);
    const vscode = getVSCodeApi();

    const [attributes, setAttributes] = useState<string[]>([]);

    const handleAttributeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAttribute(event.target.value);
        const updateNode = new ConditionNode(props.node.id, event.target.value, props.node.operator, props.node.value);
        props.onPropertyUpdate(updateNode);
    };

    const handleOperatorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedOperator(event.target.value);
        const updateNode = new ConditionNode(props.node.id, props.node.attribute, event.target.value, props.node.value);
        props.onPropertyUpdate(updateNode);
    };

    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedValue(event.target.value);
        const updateNode = new ConditionNode(props.node.id, props.node.attribute, props.node.operator, event.target.value);
        props.onPropertyUpdate(updateNode);
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
        <div style={propertyNode}>
            <div style={{...containerStyle, marginTop: '10px'} }>
                <label htmlFor="dropdown" style={labelStyle}>Attribute:</label>
                <select id="dropdown"
                    value={selectedAttribute}
                    onChange={handleAttributeChange}
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
            <div style={{...containerStyle, marginTop: '10px'} }>
                <label htmlFor="dropdown" style={labelStyle}>Operator:</label>
                <select id="dropdown"
                    value={selectedOperator}
                    onChange={handleOperatorChange}
                    style={selectStyle}
                >
                    {!selectedOperator && <option value="" style={optionStyle}></option>}
                    {operators.map(operator => (
                        <option key={operator} value={operator} style={optionStyle}>
                            {operator}
                        </option>
                    ))}
                </select>
            </div>
            <div style={containerStyle}>
                <label style={labelStyle}>Value:</label>
                <input
                    type="text"
                    onChange={handleValueChange}
                    value={selectedValue}
                    style={inputStyle}
                />
            </div>
            <div style={containerStyle}>
                {!selectedAttribute && <p style={{ color: 'red' }}>Please select an attribute.</p>}
            </div>
            <div style={containerStyle}>
                {!selectedOperator && <p style={{ color: 'red' }}>Please select an operator.</p>}
            </div>
        </div>
    );
}

const getEntityName = (node: IConditionNode): string | undefined => {
    if (node.parent?.parent instanceof EntityNode) {
        return (node.parent.parent as EntityNode).name;
    }
    else if(node.parent?.parent instanceof LinkEntityNode) {
        return (node.parent.parent as LinkEntityNode).name;
    }
    throw new Error('Invalid parent node type');
}