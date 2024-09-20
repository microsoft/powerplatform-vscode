/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const sidebar: React.CSSProperties = {
    flex: 1,
    height: '100vh',
    overflowY: 'auto',
    borderRight: '1px solid #ddd',
    padding: '10px',
    position: 'relative'
};

export const showQueryButton: React.CSSProperties = {
    position: 'absolute',
    top: '15px',
    right: '10px'
};

export const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh'
};

export const fetchXmlStyle: React.CSSProperties = {
    flex: 2,
    height: '100vh',
};

export const actionButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: '#007acc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '16px',
  };

  export const showQueryButtonStyle: React.CSSProperties = {
    ...actionButtonStyle,
    backgroundColor: '#555', // Override the color for Show Query
  };

  export const convertButtonStyle: React.CSSProperties = {
    ...actionButtonStyle,
    backgroundColor: '#f39c12', // Override the color for Convert
  };

  export const executeButtonStyle: React.CSSProperties = {
    ...actionButtonStyle,
    backgroundColor: '#27ae60', // Override the color for Execute
  };

  export const resultSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  export const codeEditorStyle: React.CSSProperties = {
    backgroundColor: '#333',
    color: 'white',
    padding: '16px',
    borderRadius: '8px',
  };

  export const editorTextareaStyle: React.CSSProperties = {
    width: '100%',
    height: '150px',
    backgroundColor: '#000',
    color: 'white',
    border: 'none',
    padding: '8px',
    borderRadius: '4px',
  };
