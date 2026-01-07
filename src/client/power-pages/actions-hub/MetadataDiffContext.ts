/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { IFileComparisonResult, ISiteComparisonResults } from "./models/IFileComparisonResult";
import { SiteVisibility } from "./models/SiteVisibility";

/**
 * Enum for metadata diff view modes
 */
export enum MetadataDiffViewMode {
    Tree = "tree",
    List = "list"
}

/**
 * Enum for metadata diff sort modes (used in list view)
 */
export enum MetadataDiffSortMode {
    Path = "path",
    Name = "name",
    Status = "status"
}

const VIEW_MODE_CONTEXT_KEY = "microsoft.powerplatform.pages.metadataDiffViewMode";
const VIEW_MODE_STORAGE_KEY = "microsoft.powerplatform.pages.metadataDiff.viewModePreference";
const SORT_MODE_CONTEXT_KEY = "microsoft.powerplatform.pages.metadataDiffSortMode";
const SORT_MODE_STORAGE_KEY = "microsoft.powerplatform.pages.metadataDiff.sortModePreference";

/**
 * Context for storing metadata diff comparison results
 * This allows the ActionsHubTreeDataProvider to display the diff results in the tree view
 * Supports multiple site comparisons simultaneously
 */
class MetadataDiffContextClass {
    private _siteResults: Map<string, ISiteComparisonResults> = new Map();
    private _viewMode: MetadataDiffViewMode = MetadataDiffViewMode.Tree;
    private _sortMode: MetadataDiffSortMode = MetadataDiffSortMode.Path;
    private _extensionContext: vscode.ExtensionContext | undefined;

    private _onChanged: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onChanged: vscode.Event<void> = this._onChanged.event;

    /**
     * Generate a unique key for storing site comparison results
     * @param websiteId The website ID
     * @param environmentId The environment ID
     * @param isImported Whether this is an imported comparison
     * @returns A unique key string
     */
    public getUniqueKey(websiteId: string, environmentId: string, isImported: boolean = false): string {
        return isImported
            ? `${websiteId}_${environmentId}_imported`
            : `${websiteId}_${environmentId}`;
    }

    /**
     * Check if there is an imported comparison for the given website and environment
     * @param websiteId The website ID
     * @param environmentId The environment ID
     * @returns True if an imported comparison exists
     */
    public hasImportedComparison(websiteId: string, environmentId: string): boolean {
        const key = this.getUniqueKey(websiteId, environmentId, true);
        return this._siteResults.has(key);
    }

    /**
     * Get the extension context for accessing global storage
     */
    public get extensionContext(): vscode.ExtensionContext | undefined {
        return this._extensionContext;
    }

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
        // Load persisted sort mode preference from global state
        const savedSortMode = context.globalState.get<MetadataDiffSortMode>(SORT_MODE_STORAGE_KEY);
        if (savedSortMode) {
            this._sortMode = savedSortMode;
        }
        // Update VS Code context with loaded view mode and sort mode
        this.updateViewModeContext();
        this.updateSortModeContext();
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

    public get sortMode(): MetadataDiffSortMode {
        return this._sortMode;
    }

    public setSortMode(mode: MetadataDiffSortMode): void {
        if (this._sortMode !== mode) {
            this._sortMode = mode;
            this.updateSortModeContext();
            this.persistSortMode();
            this._onChanged.fire();
        }
    }

    /**
     * Set results for a specific site. If results already exist for this site, they are replaced.
     * @param results The comparison results
     * @param siteName The name of the remote site
     * @param localSiteName The name of the local site
     * @param environmentName The name of the environment
     * @param websiteId The website ID
     * @param environmentId The environment ID
     * @param isImported Whether this is an imported comparison
     * @param exportedAt ISO 8601 timestamp when the comparison was exported (only for imported comparisons)
     * @param dataModelVersion The data model version of the site (1 = Standard, 2 = Enhanced)
     * @param websiteUrl The website URL
     * @param siteVisibility The site visibility (public, private, etc.)
     * @param creator The creator of the site
     * @param createdOn ISO 8601 timestamp when the site was created
     * @param isCodeSite Whether this is a code site
     */
    public setResults(
        results: IFileComparisonResult[],
        siteName: string,
        localSiteName: string,
        environmentName: string,
        websiteId: string,
        environmentId: string,
        isImported: boolean = false,
        exportedAt?: string,
        dataModelVersion?: 1 | 2,
        websiteUrl?: string,
        siteVisibility?: SiteVisibility,
        creator?: string,
        createdOn?: string,
        isCodeSite?: boolean
    ): void {
        const key = this.getUniqueKey(websiteId, environmentId, isImported);
        if (results.length > 0) {
            this._siteResults.set(key, {
                siteName,
                localSiteName,
                environmentName,
                websiteId,
                environmentId,
                comparisonResults: results,
                isImported,
                exportedAt,
                dataModelVersion,
                websiteUrl,
                siteVisibility,
                creator,
                createdOn,
                isCodeSite
            });
        } else {
            // If no results, remove the site from the map
            this._siteResults.delete(key);
        }
        this._onChanged.fire();
    }

    /**
     * Clear results for a specific site using the unique key
     * @param websiteId The website ID
     * @param environmentId The environment ID
     * @param isImported Whether this is an imported comparison
     */
    public clearSiteByKey(websiteId: string, environmentId: string, isImported: boolean = false): void {
        const key = this.getUniqueKey(websiteId, environmentId, isImported);
        this._siteResults.delete(key);
        this._onChanged.fire();
    }

    /**
     * Remove a specific file from the comparison results for a site.
     * If this is the last file in the site, the site is removed entirely.
     * @param relativePath The relative path of the file to remove
     * @param siteName The name of the site
     */
    public removeFile(relativePath: string, siteName: string): void {
        // Find the site by name
        for (const [key, siteResult] of this._siteResults.entries()) {
            if (siteResult.siteName === siteName) {
                siteResult.comparisonResults = siteResult.comparisonResults.filter(
                    result => result.relativePath !== relativePath
                );

                if (siteResult.comparisonResults.length === 0) {
                    this._siteResults.delete(key);
                }

                this._onChanged.fire();
                break;
            }
        }
    }

    /**
     * Remove multiple files from the comparison results for a site in a single batch operation.
     * This is more efficient than calling removeFile multiple times as it only triggers one UI refresh.
     * If all files are removed, the site is removed entirely.
     * @param relativePaths Set of relative paths of files to remove
     * @param siteName The name of the site
     */
    public removeFiles(relativePaths: Set<string>, siteName: string): void {
        if (relativePaths.size === 0) {
            return;
        }

        // Find the site by name
        for (const [key, siteResult] of this._siteResults.entries()) {
            if (siteResult.siteName === siteName) {
                siteResult.comparisonResults = siteResult.comparisonResults.filter(
                    result => !relativePaths.has(result.relativePath)
                );

                if (siteResult.comparisonResults.length === 0) {
                    this._siteResults.delete(key);
                }

                this._onChanged.fire();
                break;
            }
        }
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

    /**
     * Update VS Code context for sort mode to control command visibility
     */
    private updateSortModeContext(): void {
        vscode.commands.executeCommand("setContext", SORT_MODE_CONTEXT_KEY, this._sortMode);
    }

    /**
     * Persist sort mode preference to global state (user-specific, not workspace-specific)
     */
    private persistSortMode(): void {
        if (this._extensionContext) {
            this._extensionContext.globalState.update(SORT_MODE_STORAGE_KEY, this._sortMode);
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
