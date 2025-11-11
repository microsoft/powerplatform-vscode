/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { MetadataDiffTreeItem } from "./tree-items/MetadataDiffTreeItem";
import { Constants } from "./Constants";
import { oneDSLoggerWrapper } from "../../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { MetadataDiffFileItem } from "./tree-items/MetadataDiffFileItem";
import { MetadataDiffFolderItem } from "./tree-items/MetadataDiffFolderItem";

// Internal utility directories created under storage that should not be
// mistaken for the downloaded website folder when recomputing diffs.
const IGNORE_STORAGE_DIRS = new Set([
    'tempDiff',          // created for one‑sided / placeholder diff views
    'imported_diff'      // created when importing a saved report
]);

interface DiffFile {
    relativePath: string;
    changes: string;
    type: string;
    workspaceContent?: string;
    storageContent?: string;
}

export class MetadataDiffTreeDataProvider implements vscode.TreeDataProvider<MetadataDiffTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private _onDidChangeTreeData: vscode.EventEmitter<MetadataDiffTreeItem | undefined | void> = new vscode.EventEmitter<MetadataDiffTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<MetadataDiffTreeItem | undefined | void> = this._onDidChangeTreeData.event;
    private _diffItems: MetadataDiffTreeItem[] = [];
    // Emits when the diff data has been fully populated for the first time
    private _onDataLoaded: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDataLoaded: vscode.Event<void> = this._onDataLoaded.event;
    private _dataLoadedNotified = false;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    public static initialize(context: vscode.ExtensionContext): MetadataDiffTreeDataProvider {
        return new MetadataDiffTreeDataProvider(context);
    }

    private refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Recompute the diff tree without clearing the downloaded site storage.
     * Used after in-place edits (e.g. discard local changes) so that we don't
     * wipe the remote snapshot but still update the UI & contexts.
     */
    public async recomputeDiff(): Promise<void> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) { return; }
            const workspacePath = workspaceFolders[0].uri.fsPath;
            const storagePath = this._context.storageUri?.fsPath;
            if (!storagePath) { return; }

            const diffFiles = await this.getDiffFiles(workspacePath, storagePath);
            const items = this.buildTreeHierarchy(diffFiles);
            this._diffItems = items;
            vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiff.hasData", this._diffItems.length > 0);
            this.refresh();
            vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");
            if (!this._dataLoadedNotified && this._diffItems.length > 0) {
                this._dataLoadedNotified = true;
                this._onDataLoaded.fire();
            }
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_CURRENT_ENV_FETCH_FAILED,
                error as string,
                error as Error,
                { methodName: this.recomputeDiff },
                {}
            );
        }
    }

    clearItems(): void {
        this._diffItems = [];
    this._dataLoadedNotified = false; // allow message again after reset
        // Reset any stored data
        const storagePath = this._context.storageUri?.fsPath;
        if (storagePath && fs.existsSync(storagePath)) {
            try {
                fs.rmSync(storagePath, { recursive: true, force: true });
                fs.mkdirSync(storagePath, { recursive: true });
            } catch (error) {
                console.error('Error cleaning storage path:', error);
            }
        }
        // Set context to show welcome message again
        vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiff.hasData", false);
    this._onDidChangeTreeData.fire();
    // Also refresh Actions Hub so the integrated root node updates
    vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");
    }

    getTreeItem(element: MetadataDiffTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    private getAllFilesRecursively(dir: string, fileList: string[] = []): string[] {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                this.getAllFilesRecursively(fullPath, fileList);
            } else {
                fileList.push(fullPath);
            }
        }

        return fileList;
    }

    private async getDiffFiles(workspacePath: string, storagePath: string): Promise<Map<string, { workspaceFile?: string; storageFile?: string }>> {
        const diffFiles = new Map<string, { workspaceFile?: string; storageFile?: string }>();

        // Get website directory from storage path
        const websitePath = await this.getWebsitePath(storagePath);
        if (!websitePath) {
            return diffFiles;
        }

        const workspaceFiles = this.getAllFilesRecursively(workspacePath);
        const storageFiles = this.getAllFilesRecursively(websitePath);

        // Create normalized path maps for comparison
        const workspaceMap = new Map(workspaceFiles.map(f => {
            const normalized = path.relative(workspacePath, f).replace(/\\/g, '/');
            return [normalized, f];
        }));

        const storageMap = new Map(storageFiles.map(f => {
            const normalized = path.relative(websitePath, f).replace(/\\/g, '/');
            return [normalized, f];
        }));

        // Compare files
        for (const [relativePath, workspaceFile] of workspaceMap.entries()) {
            const storageFile = storageMap.get(relativePath);

            if (!storageFile) {
                // File only exists in workspace
                diffFiles.set(relativePath, { workspaceFile });
                continue;
            }

            // Compare content only if both files exist
            const workspaceContent = fs.readFileSync(workspaceFile, 'utf8').replace(/\r\n/g, '\n');
            const storageContent = fs.readFileSync(storageFile, 'utf8').replace(/\r\n/g, '\n');

            if (workspaceContent !== storageContent) {
                diffFiles.set(relativePath, { workspaceFile, storageFile });
            }
        }

        // Check for files only in storage
        for (const [relativePath, storageFile] of storageMap.entries()) {
            if (!workspaceMap.has(relativePath)) {
                diffFiles.set(relativePath, { storageFile });
            }
        }

        return diffFiles;
    }

    private async getWebsitePath(storagePath: string): Promise<string | undefined> {
        try {
            const folders = fs.readdirSync(storagePath)
                .filter(f => {
                    if (f.startsWith('.')) { return false; }
                    if (IGNORE_STORAGE_DIRS.has(f)) { return false; }
                    const full = path.join(storagePath, f);
                    return fs.statSync(full).isDirectory();
                });

            if (folders.length === 0) {
                return undefined;
            }

            // If multiple candidate folders exist (e.g. multiple downloads),
            // pick the most recently modified directory instead of relying on
            // filesystem enumeration order, which is not guaranteed.
            let chosen = folders[0];
            if (folders.length > 1) {
                let latestMTime = -1;
                for (const f of folders) {
                    const stat = fs.statSync(path.join(storagePath, f));
                    const mtime = stat.mtimeMs;
                    if (mtime > latestMTime) {
                        latestMTime = mtime;
                        chosen = f;
                    }
                }
            }
            return path.join(storagePath, chosen);
        } catch (error) {
            console.error('Error finding website path:', error);
        }
        return undefined;
    }

    async getChildren(element?: MetadataDiffTreeItem): Promise<MetadataDiffTreeItem[] | null | undefined> {
        if (element) {
            return element.getChildren();
        }

        // If we have imported diff items, return those
        if (this._diffItems && this._diffItems.length > 0) {
            return this._diffItems;
        }

        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return [];
            }

            const workspacePath = workspaceFolders[0].uri.fsPath;
            const storagePath = this._context.storageUri?.fsPath;
            if (!storagePath) {
                throw new Error("Storage path is not defined");
            }

            const diffFiles = await this.getDiffFiles(workspacePath, storagePath);
            if (diffFiles.size === 0) {
                // Explicitly clear cache & contexts when no differences
                this._diffItems = [];
                vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiff.hasData", false);
                return [];
            }

            const items = this.buildTreeHierarchy(diffFiles);
            // Cache for Actions Hub wrapper which reads the private field directly
            this._diffItems = items;
            // Update contexts so welcome content & root node state update
            vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiff.hasData", this._diffItems.length > 0);
            // Refresh Actions Hub so the Metadata Diff group re-renders with data
            vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");
            if (!this._dataLoadedNotified && this._diffItems.length > 0) {
                this._dataLoadedNotified = true;
                this._onDataLoaded.fire();
            }
            return items;
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_CURRENT_ENV_FETCH_FAILED,
                error as string,
                error as Error,
                { methodName: this.getChildren },
                {}
            );
            return null;
        }
    }

    private buildTreeHierarchy(filePathMap: Map<string, { workspaceFile?: string; storageFile?: string }>): MetadataDiffTreeItem[] {
        const rootNode = new MetadataDiffFolderItem('');

        for (const [relativePath, { workspaceFile, storageFile }] of filePathMap.entries()) {
            const parts = relativePath.split('/');
            let currentNode = rootNode;

            // Create folder hierarchy
            for (let i = 0; i < parts.length - 1; i++) {
                const folderName = parts[i];
                let folderNode = currentNode.getChildrenMap().get(folderName) as MetadataDiffFolderItem;

                if (!folderNode) {
                    folderNode = new MetadataDiffFolderItem(folderName);
                    currentNode.getChildrenMap().set(folderName, folderNode);
                }

                currentNode = folderNode;
            }

            // Add file
            const fileName = parts[parts.length - 1];
            const fileNode = new MetadataDiffFileItem(
                fileName,
                workspaceFile,
                storageFile,
                true,
                relativePath
            );
            fileNode.description = this.getChangeDescription(workspaceFile, storageFile);
            currentNode.getChildrenMap().set(fileName, fileNode);
        }

        // Convert the root's children map to array
        return Array.from(rootNode.getChildrenMap().values());
    }

    private getChangeDescription(workspaceFile?: string, storageFile?: string): string {
        // Changed labels to align with updated wording (Local vs Environment)
        if (!workspaceFile) return 'Only in Environment';
        if (!storageFile) return 'Only in Local';
        return 'Modified';
    }

    async setDiffFiles(files: DiffFile[]): Promise<void> {
        const rootNode = new MetadataDiffFolderItem('');
        const sortedFiles = files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

        // Get temp directory for storing imported file contents
        const tempDir = path.join(this._context.storageUri?.fsPath || '', 'imported_diff');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        for (const file of sortedFiles) {
            const parts = file.relativePath.split('/');
            let currentNode = rootNode;

            // Create folder hierarchy
            for (let i = 0; i < parts.length - 1; i++) {
                const folderName = parts[i];
                let folderNode = currentNode.getChildrenMap().get(folderName) as MetadataDiffFolderItem;

                if (!folderNode) {
                    // Create folder with expanded state in constructor
                    folderNode = new MetadataDiffFolderItem(folderName, vscode.TreeItemCollapsibleState.Expanded);
                    folderNode.iconPath = new vscode.ThemeIcon("folder");
                    currentNode.getChildrenMap().set(folderName, folderNode);
                }

                currentNode = folderNode;
            }

            // Rest of the file handling code...
            const fileName = parts[parts.length - 1];
            const filePath = path.join(tempDir, file.relativePath);
            const dirPath = path.dirname(filePath);
            fs.mkdirSync(dirPath, { recursive: true });

            // Extract original file extension to preserve it
            const fileExt = path.extname(fileName);

            let workspaceFilePath: string | undefined;
            let storageFilePath: string | undefined;

            if (file.workspaceContent) {
                // Use the original file extension in the temp file to preserve language identification
                workspaceFilePath = `${filePath}.workspace${fileExt}`;
                fs.writeFileSync(workspaceFilePath, file.workspaceContent);
            }

            if (file.storageContent) {
                // Use the original file extension in the temp file to preserve language identification
                storageFilePath = `${filePath}.storage${fileExt}`;
                fs.writeFileSync(storageFilePath, file.storageContent);
            }

            const fileNode = new MetadataDiffFileItem(
                fileName,
                workspaceFilePath,
                storageFilePath,
                true,
                file.relativePath
            );
            fileNode.description = file.changes;
            fileNode.iconPath = new vscode.ThemeIcon("file");
            fileNode.command = {
                command: 'microsoft.powerplatform.pages.metadataDiff.openDiff',
                title: 'Show Diff',
                arguments: [workspaceFilePath, storageFilePath]
            };

            currentNode.getChildrenMap().set(fileName, fileNode);
        }

        this._diffItems = Array.from(rootNode.getChildrenMap().values());
    this._onDidChangeTreeData.fire();
    // Mark that we now have data and refresh Actions Hub view
    vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiff.hasData", this._diffItems.length > 0);
    vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");
    if (!this._dataLoadedNotified && this._diffItems.length > 0) {
        this._dataLoadedNotified = true;
        this._onDataLoaded.fire();
    }
    }
}
