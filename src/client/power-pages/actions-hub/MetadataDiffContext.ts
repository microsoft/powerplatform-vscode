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

/**
 * Interface for storing comparison results per site
 */
export interface ISiteComparisonResults {
    siteName: string;
    environmentName: string;
    comparisonResults: IFileComparisonResult[];
}

const VIEW_MODE_CONTEXT_KEY = "microsoft.powerplatform.pages.metadataDiffViewMode";
const VIEW_MODE_STORAGE_KEY = "microsoft.powerplatform.pages.metadataDiff.viewModePreference";

/**
 * Context for storing metadata diff comparison results
 * This allows the ActionsHubTreeDataProvider to display the diff results in the tree view
 * Supports multiple site comparisons simultaneously
 */
class MetadataDiffContextClass {
    private _siteResults: Map<string, ISiteComparisonResults> = new Map();
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

    /**
     * Get all site comparison results
     */
    public get allSiteResults(): ISiteComparisonResults[] {
        return Array.from(this._siteResults.values());
    }

    /**
     * Get comparison results for a specific site
     */
    public getSiteResults(siteName: string): ISiteComparisonResults | undefined {
        return this._siteResults.get(siteName);
    }

    /**
     * Check if there are any active comparison results
     */
    public get isActive(): boolean {
        return this._siteResults.size > 0;
    }

    /**
     * Get the total number of changes across all sites
     */
    public get totalChanges(): number {
        let total = 0;
        for (const siteResult of this._siteResults.values()) {
            total += siteResult.comparisonResults.length;
        }
        return total;
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

    /**
     * Set results for a specific site. If results already exist for this site, they are replaced.
     * @param results The comparison results
     * @param siteName The name of the site
     * @param environmentName The name of the environment
     */
    public setResults(results: IFileComparisonResult[], siteName: string, environmentName: string): void {
        if (results.length > 0) {
            this._siteResults.set(siteName, {
                siteName,
                environmentName,
                comparisonResults: results
            });
        } else {
            // If no results, remove the site from the map
            this._siteResults.delete(siteName);
        }
        this._onChanged.fire();
    }

    /**
     * Clear results for a specific site
     */
    public clearSite(siteName: string): void {
        this._siteResults.delete(siteName);
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

    /**
     * Clear all site comparison results
     */
    public clear(): void {
        this._siteResults.clear();
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

    // Legacy getters for backward compatibility
    /**
     * @deprecated Use allSiteResults instead
     */
    public get comparisonResults(): IFileComparisonResult[] {
        const allResults: IFileComparisonResult[] = [];
        for (const siteResult of this._siteResults.values()) {
            allResults.push(...siteResult.comparisonResults);
        }
        return allResults;
    }

    /**
     * @deprecated Use allSiteResults instead
     */
    public get siteName(): string {
        const firstSite = this._siteResults.values().next().value;
        return firstSite?.siteName || "";
    }
}

const MetadataDiffContext = new MetadataDiffContextClass();
export default MetadataDiffContext;
