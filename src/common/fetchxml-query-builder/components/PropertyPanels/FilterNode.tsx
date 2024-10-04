/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React from 'react';
import { IFilterNode } from "../../interfaces/Node";
import { labelStyle, optionStyle, propertyNode, selectStyle } from "./Styles";
import { FilterType } from '../../constants/constants';
import { FilterNode } from '../../models/Node';

export interface FilterNodePropertyPanelProps {
    node: IFilterNode;
    onPropertyUpdate: (updatedNode: IFilterNode) => void;
}

export const FilterNodePropertyPanel: React.FC<FilterNodePropertyPanelProps> = (props) => {
    const filterTypeOptions = ['and', 'or'];

    const [selectedFilterType, setSelectedFilterType] = React.useState(props.node.filterType);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFilterType(event.target.value as FilterType);
        const updateNode = new FilterNode(props.node.id, event.target.value as FilterType);
        props.onPropertyUpdate(updateNode);
    };

    return (
        <div style={propertyNode}>
            <label htmlFor="dropdown" style={labelStyle}>Filter Type:</label>
            <select id="dropdown"
                value={selectedFilterType}
                onChange={handleChange}
                style={selectStyle}
            >
                {filterTypeOptions.map(option => (
                    <option key={option} value={option} style={optionStyle}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}