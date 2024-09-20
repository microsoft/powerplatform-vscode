/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React from "react";
import { resultSectionStyle, codeEditorStyle, editorTextareaStyle, convertButtonStyle, executeButtonStyle } from "./Styles";
import { getVSCodeApi } from "../utility/utility";
interface ResultPanelProps {
    query: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = (props) => {
    const [queryResult, setQueryResult] = React.useState<string>('');
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
        vscode.postMessage({type:'executeQuery', query: query})
    }

    React.useEffect(() => {
        window.addEventListener('message', messageHandler);

        // Request attributes for the selected entity
        // vscode.postMessage({ type: 'entitySelected', entity: ''});

        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, []);


    return (
        <div style={resultSectionStyle}>
            {/* Code Editor Section */}
            <div style={codeEditorStyle}>
                <h3>XML Query</h3>
                <textarea
                    style={editorTextareaStyle}
                    placeholder="Write your query here..."
                    value={query}
                />
                {/* Convert and Execute Buttons */}
                <div>
                    <button style={convertButtonStyle}>Convert</button>
                    <button style={executeButtonStyle} onClick={executeQuery}>Execute</button>
                </div>
            </div>

            {/* Query Result Table */}
            <div>
                {queryResult && queryResult}
            </div>
        </div>
    );

}


// const QueryResultTable = () => {
//     return (
//         <table className="result-table">
//             <thead>
//                 <tr>
//                     <th className="table-header">Label</th>
//                     {/* More columns */}
//                 </tr>
//             </thead>
//             <tbody>
//                 <tr>
//                     <td className="table-cell">Content</td>
//                     {/* More cells */}
//                 </tr>
//                 {/* More rows */}
//             </tbody>
//         </table>
//     );
// };
