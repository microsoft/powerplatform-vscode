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

    private async getDiffFiles(workspacePath: string, storagePath: string): Promise<string[]> {
        const diffFiles: Set<string> = new Set();

        const workspaceFiles = this.getAllFilesRecursively(workspacePath);
        const storageFiles = this.getAllFilesRecursively(storagePath);

        // Check workspace files against storage files
        for (const file of workspaceFiles) {
            const relativePath = path.relative(workspacePath, file);
            const storageFile = path.join(storagePath, relativePath);

            if (fs.existsSync(storageFile)) {
                const workspaceContent = fs.readFileSync(file, "utf8");
                const storageContent = fs.readFileSync(storageFile, "utf8");

                if (workspaceContent !== storageContent) {
                    diffFiles.add(relativePath);
                }
            } else {
                diffFiles.add(relativePath);
            }
        }

        // Check storage files against workspace files (to detect deletions)
        for (const file of storageFiles) {
            const relativePath = path.relative(storagePath, file);
            const workspaceFile = path.join(workspacePath, relativePath);

            if (!fs.existsSync(workspaceFile)) {
                diffFiles.add(relativePath);
            }
        }

        return Array.from(diffFiles);
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
            //check if storage path contains any files
            if (folderNames.length === 0) {
                return [];
            }
            const websitePath = path.join(storagePath, folderNames[0]);

            const diffFiles = await this.getDiffFiles(workspacePath, websitePath);
            if (diffFiles.length === 0) {
                return [];
            }

            const filePathMap = new Map<string, string>();

            diffFiles.forEach(relativePath => {
                const storedFileUri = vscode.Uri.joinPath(vscode.Uri.file(websitePath), relativePath);
                    filePathMap.set(relativePath, storedFileUri.fsPath);
            });

            return this.buildTreeHierarchy(filePathMap);
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

    private buildTreeHierarchy(filePathMap: Map<string, string>): MetadataDiffTreeItem[] {
        const rootItems: Map<string, MetadataDiffTreeItem> = new Map();
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error("No workspace folders found");
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        filePathMap.forEach((storedFilePath, relativePath) => {
            const parts = relativePath.split(path.sep);
            let currentLevel = rootItems;
            let parentItem: MetadataDiffTreeItem | undefined;

            for (let i = 0; i < parts.length; i++) {
                const isFile = i === parts.length - 1;
                const name = parts[i];

                if (!currentLevel.has(name)) {
                    let newItem: MetadataDiffTreeItem;

                    if (isFile) {
                        const absoluteWorkspaceFilePath = path.join(workspaceRoot, relativePath);
                        newItem = new MetadataDiffFileItem(name, absoluteWorkspaceFilePath, storedFilePath);
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

        return Array.from(rootItems.values());
    }
}
