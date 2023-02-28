/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
//import * as nls from 'vscode-nls';
//const localize: nls.LocalizeFunc = nls.loadMessageBundle();

// Create a diagnostics connection to output warning/error messages to "Problems" tab
const connection = vscode.languages.createDiagnosticCollection("FileDeleteEvent");

export async function validateTextDocument(uri: vscode.Uri, patterns: RegExp[], searchByName: boolean): Promise<void> {
    try {
        const textDocument = await vscode.workspace.openTextDocument(uri);
        const text = textDocument.getText();

        let m: RegExpExecArray | null;

        const diagnostics: vscode.Diagnostic[] = [];
        patterns.forEach(pattern => {
            while ((m = pattern.exec(text))) {
                const diagnostic: vscode.Diagnostic = {
                    severity: vscode.DiagnosticSeverity.Warning,
                    range: new vscode.Range(textDocument.positionAt(m.index), textDocument.positionAt(m.index + m[0].length)),
                    // localize("powerPages.searchByNameReferenceMessage", `Deleted file might be referenced by name here.`)
                    message: `PowerPages: ` + (searchByName ? `File might be referenced by name "${m[0]}" here.` : ""),
                    source: 'ex',
                    // relatedInformation: [
                    //     new vscode.DiagnosticRelatedInformation(new vscode.Location(textDocument.uri, new vscode.Range(new vscode.Position(1, 8), new vscode.Position(1, 9))), 'first assignment to `x`')
                    // ]
                };
                diagnostics.push(diagnostic);
            }
        });

        // Send the computed diagnostics to VSCode.
        connection.set(uri, diagnostics.concat(vscode.languages.getDiagnostics(uri)));
    }
    catch {
        // DO nothing
        // TODO - Log telemetry for info only
    }
}

export function showDiagnosticMessage() {
    const terminal = vscode.window.activeTerminal ? vscode.window.activeTerminal : vscode.window.createTerminal("Power Apps Portal");
    terminal.show(true);
    vscode.window.showWarningMessage(`Some references might be broken. Please check diagnostics for more details.`);
}

export function disposeDiagnostics() {
    connection.dispose();
}
