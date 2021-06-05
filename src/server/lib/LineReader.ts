/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
    TextDocument,
} from 'vscode-languageserver-textdocument';

export function getEditedLineContent(rowIndex: number, textDocument: TextDocument) {
    const lines = textDocument.getText().split(/\r?\n/g);
    let editedLine = '';
    for (let i = 0; i < lines.length; i++) {
        if (i === rowIndex) {
            editedLine = lines[i];
        }
    }
    return editedLine;
}
