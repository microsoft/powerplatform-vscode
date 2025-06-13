/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import * as vscode from 'vscode';


export class EditableFileSystemProvider implements vscode.FileSystemProvider {
    private _fileContentMap: { [key: string]: Uint8Array } = {};
    private _onDidChangeEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile = this._onDidChangeEmitter.event;

    watch(uri: vscode.Uri, options: { readonly recursive: boolean; readonly excludes: readonly string[]; }): vscode.Disposable {
        // For simplicity, this implementation does not support file watching.
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return new vscode.Disposable(() => {});
    }

    copy(source: vscode.Uri, destination: vscode.Uri, options: { readonly overwrite: boolean; }): void | Thenable<void> {
        // Copy is not supported in this implementation
    }

    // Read file content
    readFile(uri: vscode.Uri): Uint8Array {
        const filePath = uri.path;
        return this._fileContentMap[filePath] || new Uint8Array();
    }

    // Write file content
    writeFile(uri: vscode.Uri, content: Uint8Array): void {
        const filePath = uri.path;
        this._fileContentMap[filePath] = content;
        this._onDidChangeEmitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
    }

    // Other required methods for FileSystemProvider
    stat(uri: vscode.Uri): vscode.FileStat {
        return { type: vscode.FileType.File, ctime: Date.now(), mtime: Date.now(), size: this._fileContentMap[uri.path]?.length || 0 };
    }

    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    createDirectory(uri: vscode.Uri): void {}

    delete(uri: vscode.Uri): void {
        // Delete is not supported in this implementation
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { readonly overwrite: boolean; }): void {
        // Rename is not supported in this implementation
    }

    // Method to get file content as string
    getFileContent(uri: vscode.Uri): string {
        const filePath = uri.path;
        const content = this._fileContentMap[filePath];
        return content ? Buffer.from(content).toString('utf8') : '';
    }
}
