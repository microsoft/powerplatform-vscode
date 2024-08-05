/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export class DynamicContentProvider implements vscode.TextDocumentContentProvider {
    // File content mapping
    private fileContentMap: { [key: string]: string } = {};

    // Provide content for a given URI
    provideTextDocumentContent(uri: vscode.Uri): string {
        const filePath = uri.path;
        return this.fileContentMap[filePath] || 'File not found';
    }

    // Update content for a given file
    updateFileContent(filePath: string, content: string) {
        this.fileContentMap[filePath] = content;
        const uri = vscode.Uri.parse(`readonly:${filePath}`);
        this._onDidChangeEmitter.fire(uri);
    }

    private _onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    readonly onDidChange = this._onDidChangeEmitter.event;
}
