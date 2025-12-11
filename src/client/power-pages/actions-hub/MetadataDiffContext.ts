/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { IFileComparisonResult } from "./models/IFileComparisonResult";

/**
 * Enum for metadata diff view modes
 */
export enum MetadataDiffViewMode {
    Tree = "tree",
    List = "list"
}

const VIEW_MODE_CONTEXT_KEY = "microsoft.powerplatform.pages.metadataDiffViewMode";
const VIEW_MODE_STORAGE_KEY = "microsoft.powerplatform.pages.metadataDiff.viewModePreference";

/**
 * Context for storing metadata diff comparison results
 * This allows the ActionsHubTreeDataProvider to display the diff results in the tree view
 */
class MetadataDiffContextClass {
    private _comparisonResults: IFileComparisonResult[] = [];
    private _siteName: string = "";
    private _isActive: boolean = false;
    private _viewMode: MetadataDiffViewMode = MetadataDiffViewMode.List;
    private _extensionContext: vscode.ExtensionContext | undefined;

    private _onChanged: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onChanged: vscode.Event<void> = this._onChanged.event;

    /**
     * Initialize the context with the extension context for state persistence.
     * This should be called once during extension activation.
     */
    public initialize(context: vscode.ExtensionContext): void {
        this._extensionContext = context;
        // Load persisted view mode preference from global state (user-specific, not workspace-specific)
        const savedViewMode = context.globalState.get<MetadataDiffViewMode>(VIEW_MODE_STORAGE_KEY);
        if (savedViewMode) {
            this._viewMode = savedViewMode;
        }
        // Update VS Code context with loaded view mode
        this.updateViewModeContext();
    }

    public get comparisonResults(): IFileComparisonResult[] {
        return this._comparisonResults;
    }

    public get siteName(): string {
        return this._siteName;
    }

    public get isActive(): boolean {
        return this._isActive;
    }

    public get viewMode(): MetadataDiffViewMode {
        return this._viewMode;
    }

    public get isTreeView(): boolean {
        return this._viewMode === MetadataDiffViewMode.Tree;
    }

    public get isListView(): boolean {
        return this._viewMode === MetadataDiffViewMode.List;
    }

    public setResults(results: IFileComparisonResult[], siteName: string): void {
        this._comparisonResults = results;
        this._siteName = siteName;
        this._isActive = results.length > 0;
        this._onChanged.fire();
    }

    public toggleViewMode(): void {
        this._viewMode = this._viewMode === MetadataDiffViewMode.Tree ? MetadataDiffViewMode.List : MetadataDiffViewMode.Tree;
        this.updateViewModeContext();
        this._onChanged.fire();
    }

    public setViewMode(mode: MetadataDiffViewMode): void {
        if (this._viewMode !== mode) {
            this._viewMode = mode;
            this.updateViewModeContext();
            this.persistViewMode();
            this._onChanged.fire();
        }
    }

    public clear(): void {
        this._comparisonResults = [];
        this._siteName = "";
        this._isActive = false;
        this._onChanged.fire();
    }

    /**
     * Update VS Code context for view mode to control command visibility
     */
    private updateViewModeContext(): void {
        vscode.commands.executeCommand("setContext", VIEW_MODE_CONTEXT_KEY, this._viewMode);
    }

    /**
     * Persist view mode preference to global state (user-specific, not workspace-specific)
     */
    private persistViewMode(): void {
        if (this._extensionContext) {
            this._extensionContext.globalState.update(VIEW_MODE_STORAGE_KEY, this._viewMode);
        }
    }
}

const MetadataDiffContext = new MetadataDiffContextClass();
export default MetadataDiffContext;
