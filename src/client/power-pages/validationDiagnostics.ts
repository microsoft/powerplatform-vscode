/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = vscode.languages.createDiagnosticCollection("FileDeleteEvent");

export async function validateTextDocument(textDocument: vscode.TextDocument, patterns: RegExp[]): Promise<void> {
    const text = textDocument.getText();
    let m: RegExpExecArray | null;

    const diagnostics: vscode.Diagnostic[] = [];
    patterns.forEach(pattern => {
        m = pattern.exec(text);
        while ((m = pattern.exec(text))) {
            const diagnostic: vscode.Diagnostic = {
                severity: vscode.DiagnosticSeverity.Warning,
                range: new vscode.Range(textDocument.positionAt(m.index), textDocument.positionAt(m.index + m[0].length)),
                message: `${m[0]} here might be referencing deleted file by name.`,
                source: 'ex',
                // relatedInformation: [
                //     new vscode.DiagnosticRelatedInformation(new vscode.Location(textDocument.uri, new vscode.Range(new vscode.Position(1, 8), new vscode.Position(1, 9))), 'first assignment to `x`')
                // ]
            };
            diagnostics.push(diagnostic);
        }
    });

    // Send the computed diagnostics to VSCode.
    connection.set(textDocument.uri, diagnostics);
}
