/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";

/**
 * URI scheme for read-only remote files in metadata diff
 */
export const METADATA_DIFF_READONLY_SCHEME = "pp-metadata-diff-readonly";

/**
 * File system provider that serves local files as read-only.
 * Used for displaying remote/environment files in the diff editor
 * to prevent accidental modifications.
 */
export class ReadOnlyContentProvider implements vscode.FileSystemProvider {
    private static _instance: ReadOnlyContentProvider | undefined;
    private _disposable: vscode.Disposable | undefined;

    private _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile = this._onDidChangeFile.event;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): ReadOnlyContentProvider {
        if (!ReadOnlyContentProvider._instance) {
            ReadOnlyContentProvider._instance = new ReadOnlyContentProvider();
        }
        return ReadOnlyContentProvider._instance;
    }

    /**
     * Register the file system provider with VS Code
     */
    public register(): vscode.Disposable {
        if (!this._disposable) {
            this._disposable = vscode.workspace.registerFileSystemProvider(
                METADATA_DIFF_READONLY_SCHEME,
                this,
                { isReadonly: true }
            );
        }
        return this._disposable;
    }

    /**
     * Create a read-only URI from a file path.
     * Converts Windows paths to proper URI format (e.g., c:\Users\... -> /c:/Users/...)
     */
    public static createReadOnlyUri(filePath: string): vscode.Uri {
        // Use vscode.Uri.file() to properly convert the file path to URI format,
        // then replace the scheme with our read-only scheme
        const fileUri = vscode.Uri.file(filePath);
        return fileUri.with({ scheme: METADATA_DIFF_READONLY_SCHEME });
    }

    watch(): vscode.Disposable {
        // No-op: we don't need to watch for changes on read-only files
        return new vscode.Disposable(() => { /* no-op */ });
    }

    stat(uri: vscode.Uri): vscode.FileStat {
        // Use fsPath to get the platform-specific file system path
        const filePath = uri.fsPath;

        if (!fs.existsSync(filePath)) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        const stats = fs.statSync(filePath);

        return {
            type: stats.isDirectory() ? vscode.FileType.Directory : vscode.FileType.File,
            ctime: stats.ctimeMs,
            mtime: stats.mtimeMs,
            size: stats.size,
            permissions: vscode.FilePermission.Readonly
        };
    }

    readDirectory(): [string, vscode.FileType][] {
        // Not needed for diff view
        return [];
    }

    createDirectory(): void {
        throw vscode.FileSystemError.NoPermissions("Cannot create directory: read-only file system");
    }

    readFile(uri: vscode.Uri): Uint8Array {
        // Use fsPath to get the platform-specific file system path
        const filePath = uri.fsPath;

        if (!fs.existsSync(filePath)) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        return fs.readFileSync(filePath);
    }

    writeFile(): void {
        throw vscode.FileSystemError.NoPermissions("Cannot write: read-only file system");
    }

    delete(): void {
        throw vscode.FileSystemError.NoPermissions("Cannot delete: read-only file system");
    }

    rename(): void {
        throw vscode.FileSystemError.NoPermissions("Cannot rename: read-only file system");
    }

    public dispose(): void {
        this._disposable?.dispose();
        this._onDidChangeFile.dispose();
    }
}
