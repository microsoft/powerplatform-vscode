/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const menuStyle: React.CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: '10px',
    border: '0.5px solid #cccccc',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    maxWidth: '150px',
    zIndex: 1000,
    backgroundColor: '#1F1F1F',
};

export const submenuStyle: React.CSSProperties = {
    listStyleType: "none",
    padding: 0,
    margin: 0,
    border: "0.5px solid #cccccc",
    position: "absolute",
    left: "100%",
    top: 0,
    zIndex: 1000,
    width: "150px",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
};

export const menuItemStyle: React.CSSProperties = {
    padding: "10px",
    cursor: "pointer",
    position: "relative",
};