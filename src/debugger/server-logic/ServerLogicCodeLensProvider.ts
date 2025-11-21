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

        // Add single CodeLens at the top of the file (line 0)
        const range = new vscode.Range(0, 0, 0, 0);

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

        return codeLenses;
    }
}
