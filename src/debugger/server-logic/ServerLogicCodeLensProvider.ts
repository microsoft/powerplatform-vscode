/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

/**
 * Provides CodeLens for server logic files showing debug/run actions
 */
export class ServerLogicCodeLensProvider implements vscode.CodeLensProvider {

    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    /**
     * Refresh CodeLens display
     */
    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    /**
     * Provide CodeLens for the document
     */
    public provideCodeLenses(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

        // Only provide CodeLens for server logic files
        if (!document.fileName.includes('server-logics') || !document.fileName.endsWith('.js')) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // Find function declarations
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Match function declarations: function name() or const name = function()
            const functionMatch = line.match(/^\s*(function\s+\w+|const\s+\w+\s*=\s*(async\s+)?function)/);

            if (functionMatch) {
                const range = new vscode.Range(i, 0, i, line.length);

                // Add "Debug" CodeLens
                const debugLens = new vscode.CodeLens(range, {
                    title: '$(debug-alt) Debug',
                    tooltip: 'Debug this server logic file',
                    command: 'powerpages.debugServerLogic',
                    arguments: []
                });
                codeLenses.push(debugLens);

                // Add "Run" CodeLens
                const runLens = new vscode.CodeLens(range, {
                    title: '$(run) Run',
                    tooltip: 'Run this server logic file without debugging',
                    command: 'powerpages.runServerLogic',
                    arguments: []
                });
                codeLenses.push(runLens);

                // Only show CodeLens for the first function
                break;
            }
        }

        // If no functions found, add CodeLens at the top of the file
        if (codeLenses.length === 0 && lines.length > 0) {
            const range = new vscode.Range(0, 0, 0, 0);

            const debugLens = new vscode.CodeLens(range, {
                title: '$(debug-alt) Debug',
                tooltip: 'Debug this server logic file',
                command: 'powerpages.debugServerLogic',
                arguments: []
            });
            codeLenses.push(debugLens);

            const runLens = new vscode.CodeLens(range, {
                title: '$(run) Run',
                tooltip: 'Run this server logic file without debugging',
                command: 'powerpages.runServerLogic',
                arguments: []
            });
            codeLenses.push(runLens);
        }

        return codeLenses;
    }
}
