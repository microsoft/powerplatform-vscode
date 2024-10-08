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
    if (!menuItems.length) return null;
    return (
        <ul style={{ top: `${props.position.y}px`, left: `${props.position.x}px`, position: "absolute", ...menuStyle }}>
            {menuItems.map((item, index) => (
                <li 
                    key={index}
                    style={{...menuItemStyle, backgroundColor: hoveredItemLabel === item.label ? '#2A2A2A' : '#1F1F1F'}}
                    onMouseEnter={() => handleMouseEnter(item.label)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => {
                        item.action && item.action(props.node);
                        props.refreshTree();
                    }}
                >
                    {item.label}
                    {item.subMenuItems && activeMenu === item.label && (
                        <ul style={submenuStyle}>
                        {item.subMenuItems.map((subItem, subIndex) => (
                            <li 
                                key={subIndex} 
                                style={{...menuItemStyle, backgroundColor: hoveredItemLabel === subItem.label ? '#2A2A2A' : '#1F1F1F'}}
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
