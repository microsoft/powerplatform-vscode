/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState, useEffect } from "react";
import { resultSectionStyle, codeEditorStyle, editorTextareaStyle, convertButtonStyle, executeButtonStyle, headerRowStyles, tableStyles, tdStyles, thStyles } from "./Styles";
import { getVSCodeApi } from "../utility/utility";

interface ResultPanelProps {
    query: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = (props) => {
    const [queryResult, setQueryResult] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const query = props.query;
    const vscode = getVSCodeApi();

    const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'setQueryResult') {
            console.log(event.data.queryResult);
            setQueryResult(event.data.queryResult);
        }
    };

    const executeQuery = () => {
        console.log(query);
        vscode.postMessage({ type: 'executeQuery', query: query });
    };

    useEffect(() => {
        window.addEventListener('message', messageHandler);

        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, [messageHandler]);

    useEffect(() => {
        if (queryResult.length > 0) {
            setHeaders(Object.keys(queryResult[0]));
        } else {
            setHeaders([]);
        }
    }, [queryResult]);

    return (
        <div style={resultSectionStyle}>
            {/* Code Editor Section */}
            <div style={codeEditorStyle}>
                <h3>XML Query</h3>
                <textarea
                    style={editorTextareaStyle}
                    placeholder="Click on Show Query button to see the FetchXML query"
                    value={query}
                    readOnly // Assuming the query is not editable
                />
                {/* Convert and Execute Buttons */}
                <div>
                    <button style={convertButtonStyle}>Convert</button>
                    <button style={executeButtonStyle} onClick={executeQuery}>Execute</button>
                </div>
            </div>

            {/* Query Result Table */}
            <div>
                <h3>Query Result</h3>
                <table style={tableStyles}>
                    <thead>
                        <tr style={headerRowStyles}>
                            {headers.map((header, index) => (
                                <th key={index} style={thStyles}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {queryResult.map((item, rowIndex) => (
                            <tr key={rowIndex}>
                                {headers.map((header, cellIndex) => (
                                    <td key={cellIndex} style={tdStyles}>{item[header]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
