/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { isServerLogicFile } from './ServerLogicUtils';
import { getLocalizedStrings } from './Constants';

/**
 * Provides CodeLens for server logic files showing debug/run actions.
 * Displays "Debug" and "Run" buttons at the top of .js files in server-logics folders.
 */
export class ServerLogicCodeLensProvider implements vscode.CodeLensProvider, vscode.Disposable {

    private readonly _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    /**
     * Disposes of the CodeLens provider resources
     */
    public dispose(): void {
        this._onDidChangeCodeLenses.dispose();
    }

    /**
     * Refreshes the CodeLens display by firing the change event
     */
    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    /**
     * Provides CodeLens items for server logic documents
     * @param document - The text document to provide CodeLens for
     * @param _ - Cancellation token (unused)
     * @returns Array of CodeLens items or empty array if not a server logic file
     */
    public provideCodeLenses(
        document: vscode.TextDocument,
        _: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

        // Only provide CodeLens for server logic files
        if (!isServerLogicFile(document.fileName)) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const localizedStrings = getLocalizedStrings();

        // Add single CodeLens at the top of the file (line 0)
        const range = new vscode.Range(0, 0, 0, 0);

        // Add "Debug" CodeLens
        const debugLens = new vscode.CodeLens(range, {
            title: `$(debug-alt) ${localizedStrings.DEBUG}`,
            tooltip: localizedStrings.DEBUG_TOOLTIP,
            command: 'microsoft.powerplatform.pages.debugServerLogic',
            arguments: []
        });
        codeLenses.push(debugLens);

        // Add "Run" CodeLens
        const runLens = new vscode.CodeLens(range, {
            title: `$(run) ${localizedStrings.RUN}`,
            tooltip: localizedStrings.RUN_TOOLTIP,
            command: 'microsoft.powerplatform.pages.runServerLogic',
            arguments: []
        });
        codeLenses.push(runLens);

        return codeLenses;
    }
}
