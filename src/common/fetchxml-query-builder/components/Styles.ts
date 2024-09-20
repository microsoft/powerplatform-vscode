/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const sidebar: React.CSSProperties = {
    flexDirection: 'column',
    overflow: 'auto',
    height: '100vh',
    borderRight: '0.5px solid #cccccc',
    padding: '10px',
    position: 'relative',
    display: 'flex',
};

export const resizer: React.CSSProperties = {
  width: '2px',
  cursor: 'col-resize',
  backgroundColor: '#000',
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
    width: '100%'
};

export const fetchXmlStyle: React.CSSProperties = {
    flex: 1,
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
    backgroundColor: '#f4f4f4',
    padding: '10px',
    border: '1px solid #ddd',
    textTransform: 'capitalize',
  };

  export const tdStyles: React.CSSProperties = {
    padding: '10px',
    border: '1px solid #ddd',
  };

  export const headerRowStyles: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    fontWeight: 'bold',
  };
