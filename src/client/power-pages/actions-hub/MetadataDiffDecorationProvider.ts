/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { METADATA_DIFF_URI_SCHEME } from "./tree-items/metadata-diff/MetadataDiffFileTreeItem";
import { FileComparisonStatus } from "./models/IFileComparisonResult";
import { Constants } from "./Constants";

/**
 * File decoration provider for metadata diff files.
 * Provides colored status badges (M, A, D) similar to Git's change indicators.
 */
export class MetadataDiffDecorationProvider implements vscode.FileDecorationProvider {
    private static _instance: MetadataDiffDecorationProvider | undefined;
    private _disposable: vscode.Disposable | undefined;

    private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
    public readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): MetadataDiffDecorationProvider {
        if (!MetadataDiffDecorationProvider._instance) {
            MetadataDiffDecorationProvider._instance = new MetadataDiffDecorationProvider();
        }
        return MetadataDiffDecorationProvider._instance;
    }

    /**
     * Register the decoration provider with VS Code
     */
    public register(): vscode.Disposable {
        if (!this._disposable) {
            this._disposable = vscode.window.registerFileDecorationProvider(this);
        }
        return this._disposable;
    }

    /**
     * Trigger a refresh of all decorations
     */
    public refresh(): void {
        this._onDidChangeFileDecorations.fire(undefined);
    }

    /**
     * Provide file decoration for metadata diff URIs
     */
    public provideFileDecoration(uri: vscode.Uri, _: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> {
        // Only handle our custom URI scheme
        if (uri.scheme !== METADATA_DIFF_URI_SCHEME) {
            return undefined;
        }

        // Extract status from query string
        const params = new URLSearchParams(uri.query);
        const status = params.get("status");

        switch (status) {
            case FileComparisonStatus.MODIFIED:
                return new vscode.FileDecoration(
                    "M",
                    Constants.Strings.METADATA_DIFF_MODIFIED,
                    new vscode.ThemeColor("gitDecoration.modifiedResourceForeground")
                );
            case FileComparisonStatus.ADDED:
                return new vscode.FileDecoration(
                    "A",
                    Constants.Strings.METADATA_DIFF_ADDED,
                    new vscode.ThemeColor("gitDecoration.addedResourceForeground")
                );
            case FileComparisonStatus.DELETED:
                return new vscode.FileDecoration(
                    "D",
                    Constants.Strings.METADATA_DIFF_DELETED,
                    new vscode.ThemeColor("gitDecoration.deletedResourceForeground")
                );
            default:
                return undefined;
        }
    }

    public dispose(): void {
        this._disposable?.dispose();
        this._onDidChangeFileDecorations.dispose();
    }
}
