/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState, useEffect } from "react";
import { resultSectionStyle, buttonHoverStyle, codeEditorStyle, editorTextareaStyle, convertButtonStyle, executeButtonStyle, headerRowStyles, tableStyles, tdStyles, thStyles, tabButtonStyle, activeTabButtonStyle, tabContentStyle, ResultStyle, buttonDisabledStyle } from "./Styles";
import { getVSCodeApi } from "../utility/utility";

interface ResultPanelProps {
    query: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = (props) => {
    const [queryResult, setQueryResult] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [attributes, setAttributes] = useState<string[]>([]);
    const [template, setTemplate] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("execute");
    const [isConvertHovered, setIsConvertHovered] = useState<boolean>(false);
    const [isExecuteHovered, setIsExecuteHovered] = useState<boolean>(false);
    const [isQueryExecuted, setIsQueryExecuted] = useState<boolean>(false);
    const [query, setQuery] = useState<string>(props.query);
    const vscode = getVSCodeApi();

    const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'setQueryResult') {
            console.log(event.data.queryResult);
            setQueryResult(event.data.queryResult);
            setIsQueryExecuted(false);
        } else if (event.data.type === 'fetchXmlCode') {
            console.log(event.data.code);
            setQuery(event.data.code);
        }
    };

    const executeQuery = () => {
        console.log(query);
        setIsQueryExecuted(true);
        vscode.postMessage({ type: 'executeQuery', query: query });
        setActiveTab("execute");
    };

    const convertQueryToTemplate = () => {
        const template = `
        {% fetchxml Example %}
        ${query}
        {% endfetchxml %}
        `;
        setTemplate(template);
        setActiveTab("convert");
    };

    useEffect(() => {
        window.addEventListener('message', messageHandler);
        vscode.postMessage({ type: 'ready' });
        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, [messageHandler]);

    useEffect(() => {
        // Extract attribute names from the query
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(query, "text/xml");
        const attributeNodes = xmlDoc.getElementsByTagName("attribute");
        const attributeNames = Array.from(attributeNodes).map(node => node.getAttribute("name") || "");
        setAttributes(attributeNames);
    }, [query]);

    useEffect(() => {
        if (queryResult.length > 0) {
            // Filter headers based on attributes present in the query
            const filteredHeaders = Object.keys(queryResult[0]).filter(header => attributes.includes(header));
            setHeaders(filteredHeaders);
        } else {
            setHeaders([]);
        }
    }, [queryResult, attributes]);

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
                <button
                        style={{
                            ...convertButtonStyle,
                            ...(isConvertHovered ? buttonHoverStyle : {}),
                            ...(query ? {} : buttonDisabledStyle)
                        }}
                        onMouseEnter={() => setIsConvertHovered(true)}
                        onMouseLeave={() => setIsConvertHovered(false)}
                        onClick={convertQueryToTemplate}
                        disabled={!query}
                    >
                        Convert
                    </button>
                    <button
                        style={{
                            ...executeButtonStyle,
                            ...(isExecuteHovered ? buttonHoverStyle : {}),
                            ...(query ? {} : buttonDisabledStyle)
                        }}
                        onMouseEnter={() => setIsExecuteHovered(true)}
                        onMouseLeave={() => setIsExecuteHovered(false)}
                        onClick={executeQuery}
                        disabled={!query}
                    >
                        Execute
                    </button>
                </div>
            </div>

            {/* Tabs for Execute Result and Convert Result */}
            <div>
                <button
                    style={activeTab === "execute" ? activeTabButtonStyle : tabButtonStyle}
                    onClick={() => setActiveTab("execute")}
                >
                    Execute Result
                </button>
                <button
                    style={activeTab === "convert" ? activeTabButtonStyle : tabButtonStyle}
                    onClick={() => setActiveTab("convert")}
                >
                    Convert Result
                </button>
            </div>

            {/* Tab Content */}
            <div style={tabContentStyle}>
                {activeTab === "execute" && (
                    <div style={ResultStyle}>
                        <h3>Execute Result</h3>
                        {isQueryExecuted && <p>Executing query...</p>}
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
                )}
                {activeTab === "convert" && (
                    <div style={ResultStyle}>
                        <h3>Power Pages Template</h3>
                        <pre style={codeEditorStyle}>{template}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};
