/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as React from 'react';
import { INode } from '../../interfaces/Node';
import { menuItemStyle, menuStyle, submenuStyle } from './Style';
import { getMenuItems } from './Helper';

export interface IContextMenuProps {
    position: { x: number, y: number };
    node: INode;
    refreshTree: () => void;
}

export const ContextMenu: React.FC<IContextMenuProps> = (props) => {
    const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
    const [hoveredItemLabel, setHoveredItemLabel] = React.useState<string | null>(null);

    const handleMouseEnter = (label: string) => {
        setActiveMenu(label);
        setHoveredItemLabel(label);
    };
    
    const handleMouseLeave = () => {
        setActiveMenu(null);
        setHoveredItemLabel(null);
    };

    const menuItems = getMenuItems(props.node);
    return (
        <ul style={{ top: `${props.position.y}px`, left: `${props.position.x}px`, position: "absolute", ...menuStyle }}>
            {menuItems.map((item, index) => (
                <li 
                    key={index}
                    style={{...menuItemStyle, backgroundColor: hoveredItemLabel === item.label ? '#f0f0f0' : 'white'}}
                    onMouseEnter={() => handleMouseEnter(item.label)}
                    onMouseLeave={handleMouseLeave}
                >
                    {item.label}
                    {item.subMenuItems && activeMenu === item.label && (
                        <ul style={submenuStyle}>
                        {item.subMenuItems.map((subItem, subIndex) => (
                            <li 
                                key={subIndex} 
                                style={{...menuItemStyle, backgroundColor: hoveredItemLabel === subItem.label ? '#f0f0f0' : 'white'}}
                                onMouseEnter={() => setHoveredItemLabel(subItem.label)}
                                onMouseLeave={() => setHoveredItemLabel(null)}
                                onClick={() => {
                                    subItem.action && subItem.action(props.node);
                                    props.refreshTree();
                                }}
                            >
                            {subItem.label}
                            </li>
                        ))}
                        </ul>
                    )}
                </li>
            ))}
        </ul>
    );
}

