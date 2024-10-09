/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const sidebar: React.CSSProperties = {
    flexDirection: 'column',
    overflow: 'auto',
    height: '100vh',
    borderRight: '0.5px solid var(--vscode-editorGroup-border)',
    padding: '10px',
    position: 'relative',
    display: 'flex',
};

export const resizer: React.CSSProperties = {
    width: '1px',
    cursor: 'col-resize',
    backgroundColor: 'var(--vscode-editor-foreground)',
    height: '100vh',
};

export const showQueryButton: React.CSSProperties = {
    position: 'absolute',
    top: '9px',
    right: '10px',
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    fontSize: 'inherit',
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
};

export const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    width: '100%',
};

export const fetchXmlStyle: React.CSSProperties = {
    flex: 1,
    height: '100vh',
};

export const actionButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'background-color 0.3s ease',
};

export const showQueryButtonStyle: React.CSSProperties = {
    ...actionButtonStyle,
    backgroundColor: 'var(--vscode-button-secondaryBackground)', // Override the color for Show Query
};

export const convertButtonStyle: React.CSSProperties = {
    ...actionButtonStyle,
    marginRight: '16px'
};

export const executeButtonStyle: React.CSSProperties = {
    ...actionButtonStyle,
};

export const buttonHoverStyle: React.CSSProperties = {
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
};

export const buttonDisabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
};

export const resultSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
};

export const codeEditorStyle: React.CSSProperties = {
    backgroundColor: 'var(--vscode-sideBar-background)',
    color: 'var(--vscode-editor-foreground)',
    padding: '16px',
     borderBottom: '2px solid var(--vscode-editorGroup-border)'
};

export const editorTextareaStyle: React.CSSProperties = {
    width: '100%',
    height: '150px',
    backgroundColor: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    border: 'none',
    padding: '8px',
    borderRadius: '4px',
};

export const sidebarPanel: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
};

// Inline styles for the table and elements using React.CSSProperties
export const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'left',
};

export const thStyles: React.CSSProperties = {
    backgroundColor: 'var(--vscode-editor-background)',
    padding: '10px',
    border: '1px solid var(--vscode-editorGroup-border)',
    textTransform: 'capitalize',
};

export const tdStyles: React.CSSProperties = {
    padding: '10px',
    border: '1px solid var(--vscode-editorGroup-border)',
};

export const headerRowStyles: React.CSSProperties = {
    backgroundColor: 'var(--vscode-editor-background)',
    fontWeight: 'bold',
};

export const tabButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    cursor: 'pointer',
    backgroundColor: 'var(--vscode-tab-inactiveBackground)',
    color: 'var(--vscode-tab-inactiveForeground)',
    border: '0.5px solid var(--vscode-tab-border)',
    marginRight: '5px',
};

export const activeTabButtonStyle: React.CSSProperties = {
    ...tabButtonStyle,
    backgroundColor: 'var(--vscode-tab-activeBackground',
    borderTop: '2px solid var(--vscode-tab-activeBorderTop)',
    color: 'var(--vscode-tab-activeForeground)',
    borderBottom: 'none',
};

export const tabContentStyle: React.CSSProperties = {
    backgroundColor: 'var(--vscode-sidebar-background)',
};

export const ResultStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: 'var(--vscode-editor-background)',
    overflow: 'auto',
};

export const inputStyle: React.CSSProperties = {
    marginLeft: '10px',
    padding: '5px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid var(--vscode-input-border)',
    marginTop: '16px',
    flexGrow: 1, // Use flexGrow instead of flex to only increase width
    backgroundColor: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
};

export const sendButtonStyle: React.CSSProperties = {
    marginLeft: '5px',
    padding: '5px 10px',
    fontSize: '14px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#0078d4',
    color: 'white',
    cursor: 'pointer',
    marginTop: '16px',
};
