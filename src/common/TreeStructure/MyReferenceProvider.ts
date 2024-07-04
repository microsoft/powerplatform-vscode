/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */
import * as vscode from 'vscode';

export class MyReferenceProvider implements vscode.ReferenceProvider {
    async provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): Promise<vscode.Location[]> {
        const selection = vscode.window.activeTextEditor?.selection;
        if (!selection) {
            return [];
        }
        const selectedText = document.getText(selection);
        const locations: vscode.Location[] = [];

        // Check if the selected text contains Liquid braces
        let regex;
        if (selectedText.startsWith('{{') && selectedText.endsWith('}}')) {
            regex = new RegExp(escapeRegExp(selectedText), 'g');
        } else if (selectedText.startsWith('{%') && selectedText.endsWith('%}')) {
            regex = new RegExp(escapeRegExp(selectedText), 'g');
        } else {
            // Search for selected text inside Liquid braces
            regex = new RegExp(`{{[^{}]*\\b${escapeRegExp(selectedText)}\\b[^{}]*}}|{%[^{}]*\\b${escapeRegExp(selectedText)}\\b[^{}]*%}`, 'g');
        }

        const files = await vscode.workspace.findFiles('**/*.{html,css,js,json,yaml}', '**/node_modules/**');

        for (const file of files) {
            const textDocument = await vscode.workspace.openTextDocument(file);
            const text = textDocument.getText();

            let match: RegExpExecArray | null;
            while ((match = regex.exec(text)) !== null) {
                const matchText = match[0];

                // Check if the selected text is exactly within the matched text
                if (matchText.includes(selectedText)) {
                    const matchStartPosition = match.index;
                    const matchEndPosition = matchStartPosition + matchText.length;

                    const matchRange = new vscode.Range(
                        textDocument.positionAt(matchStartPosition),
                        textDocument.positionAt(matchEndPosition)
                    );
                    locations.push(new vscode.Location(textDocument.uri, matchRange));
                }
            }
        }

        return locations;
    }
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

