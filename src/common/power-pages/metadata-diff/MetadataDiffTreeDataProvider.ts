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

export class MetadataDiffTreeDataProvider implements vscode.TreeDataProvider<MetadataDiffTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private _onDidChangeTreeData: vscode.EventEmitter<MetadataDiffTreeItem | undefined | void> = new vscode.EventEmitter<MetadataDiffTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<MetadataDiffTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    private refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public static initialize(context: vscode.ExtensionContext): MetadataDiffTreeDataProvider {
        return new MetadataDiffTreeDataProvider(context);
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

        const workspaceFiles = this.getAllFilesRecursively(workspacePath);
        const storageFiles = this.getAllFilesRecursively(storagePath);

        const workspaceFileSet = new Set(workspaceFiles.map(f => path.relative(workspacePath, f)));
        const storageFileSet = new Set(storageFiles.map(f => path.relative(storagePath, f)));

        // Files only in workspace or modified files
        for (const relativePath of workspaceFileSet) {
            const workspaceFile = path.join(workspacePath, relativePath);
            const storageFile = path.join(storagePath, relativePath);

            if (!storageFileSet.has(relativePath)) {
                diffFiles.set(relativePath, { workspaceFile }); // File only in workspace
            } else {
                const workspaceContent = fs.readFileSync(workspaceFile, "utf8");
                const storageContent = fs.readFileSync(storageFile, "utf8");
                if (workspaceContent !== storageContent) {
                    const normalizedWorkspaceContent = workspaceContent.replace(/\r\n/g, "\n");
                    const normalizedStorageContent = storageContent.replace(/\r\n/g, "\n");
                    if (normalizedWorkspaceContent !== normalizedStorageContent) {
                        diffFiles.set(relativePath, { workspaceFile, storageFile }); // Modified file
                    }
                }
            }
        }

        // Files only in storage (deleted from workspace)
        for (const relativePath of storageFileSet) {
            if (!workspaceFileSet.has(relativePath)) {
                const storageFile = path.join(storagePath, relativePath);
                diffFiles.set(relativePath, { storageFile }); // File only in storage
            }
        }

        return diffFiles;
    }

    async getChildren(element?: MetadataDiffTreeItem): Promise<MetadataDiffTreeItem[] | null | undefined> {
        if (element) {
            return element.getChildren();
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

            const folderNames = fs.readdirSync(storagePath).filter(file => fs.statSync(path.join(storagePath, file)).isDirectory());
            if (folderNames.length === 0) {
                return [];
            }
            const websitePath = path.join(storagePath, folderNames[0]);

            const diffFiles = await this.getDiffFiles(workspacePath, websitePath);
            if (diffFiles.size === 0) {
                return [];
            }

            return this.buildTreeHierarchy(diffFiles);
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
        const rootItems: Map<string, MetadataDiffTreeItem> = new Map();

        filePathMap.forEach(({ workspaceFile, storageFile }, relativePath) => {
            const parts = relativePath.split(path.sep);
            let currentLevel = rootItems;
            let parentItem: MetadataDiffTreeItem | undefined;

            for (let i = 0; i < parts.length; i++) {
                const isFile = i === parts.length - 1;
                const name = parts[i];

                if (!currentLevel.has(name)) {
                    let newItem: MetadataDiffTreeItem;

                    if (isFile) {
                        const hasDiff = workspaceFile === undefined || storageFile === undefined || fs.readFileSync(workspaceFile, "utf8") !== fs.readFileSync(storageFile, "utf8");
                        newItem = new MetadataDiffFileItem(name, workspaceFile, storageFile, hasDiff);
                    } else {
                        newItem = new MetadataDiffFolderItem(name);
                    }

                    if (parentItem) {
                        (parentItem as MetadataDiffFolderItem).getChildrenMap().set(name, newItem);
                    }

                    currentLevel.set(name, newItem);
                }

                parentItem = currentLevel.get(name);
                if (!isFile) {
                    currentLevel = (parentItem as MetadataDiffFolderItem).getChildrenMap();
                }
            }
        });

        // Filter out folders without changed files
        const filterEmptyFolders = (items: MetadataDiffTreeItem[]): MetadataDiffTreeItem[] => {
            return items.filter(item => {
                if (item instanceof MetadataDiffFolderItem) {
                    const childrenArray = Array.from(item.getChildrenMap().values());
                    const filteredChildren = filterEmptyFolders(childrenArray);
                    item.getChildrenMap().clear();
                    filteredChildren.forEach(child => item.getChildrenMap().set(child.label, child));
                    return filteredChildren.length > 0;
                } else if (item instanceof MetadataDiffFileItem) {
                    return item.hasDiff;
                }
                return false;
            });
        };

        return filterEmptyFolders(Array.from(rootItems.values()));
    }
}
