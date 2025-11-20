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
        _: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

        // Only provide CodeLens for server logic files
        if (!document.fileName.includes('server-logics') || !document.fileName.endsWith('.js')) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // Standard server logic functions to detect
        const standardFunctions = ['get', 'post', 'put', 'patch', 'del'];

        // Find function declarations for standard server logic functions
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Match function declarations: function name() or async function name()
            const functionMatch = line.match(/^\s*(async\s+)?function\s+(\w+)\s*\(/);

            if (functionMatch) {
                const functionName = functionMatch[2];

                // Only add CodeLens for standard server logic functions
                if (standardFunctions.includes(functionName.toLowerCase())) {
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
                }
            }
        }

        // If no standard functions found, don't add any CodeLens
        // (file doesn't follow standard server logic pattern)

        return codeLenses;
    }
}
