/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { MetadataDiffGroupTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffGroupTreeItem";
import { MetadataDiffFolderTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFolderTreeItem";
import { MetadataDiffFileTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFileTreeItem";
import { ActionsHubTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { IFileComparisonResult } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";

describe("MetadataDiffGroupTreeItem", () => {
    describe("constructor", () => {
        it("should be an instance of ActionsHubTreeItem", () => {
            const treeItem = new MetadataDiffGroupTreeItem([], "Test Site");

            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the expected label with change count", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file1.txt",
                    remotePath: "/remote/file1.txt",
                    relativePath: "file1.txt",
                    status: "modified"
                },
                {
                    localPath: "/local/file2.txt",
                    remotePath: "/remote/file2.txt",
                    relativePath: "file2.txt",
                    status: "added"
                }
            ];
            const treeItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            expect(treeItem.label).to.include("2");
        });

        it("should have expanded collapsible state", () => {
            const treeItem = new MetadataDiffGroupTreeItem([], "Test Site");

            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Expanded);
        });

        it("should have the diff icon", () => {
            const treeItem = new MetadataDiffGroupTreeItem([], "Test Site");

            expect((treeItem.iconPath as vscode.ThemeIcon).id).to.equal("diff");
        });

        it("should have the expected context value", () => {
            const treeItem = new MetadataDiffGroupTreeItem([], "Test Site");

            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_GROUP);
        });

        it("should have site name as description", () => {
            const treeItem = new MetadataDiffGroupTreeItem([], "My Test Site");

            expect(treeItem.description).to.equal("My Test Site");
        });
    });

    describe("siteName", () => {
        it("should return the site name", () => {
            const treeItem = new MetadataDiffGroupTreeItem([], "Test Site");

            expect(treeItem.siteName).to.equal("Test Site");
        });
    });

    describe("comparisonResults", () => {
        it("should return the comparison results", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            const treeItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            expect(treeItem.comparisonResults).to.deep.equal(results);
        });
    });

    describe("getChildren", () => {
        it("should return empty array when no results", () => {
            const treeItem = new MetadataDiffGroupTreeItem([], "Test Site");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(0);
        });

        it("should return file items for files in root", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            const treeItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFileTreeItem);
        });

        it("should return folder items for files in folders", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/folder/file.txt",
                    remotePath: "/remote/folder/file.txt",
                    relativePath: "folder/file.txt",
                    status: "modified"
                }
            ];
            const treeItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFolderTreeItem);
            expect(children[0].label).to.equal("folder");
        });

        it("should create nested folder hierarchy", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/folder/subfolder/file.txt",
                    remotePath: "/remote/folder/subfolder/file.txt",
                    relativePath: "folder/subfolder/file.txt",
                    status: "modified"
                }
            ];
            const treeItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFolderTreeItem);

            const folderItem = children[0] as MetadataDiffFolderTreeItem;
            const subChildren = folderItem.getChildren();

            expect(subChildren).to.have.lengthOf(1);
            expect(subChildren[0]).to.be.instanceOf(MetadataDiffFolderTreeItem);
            expect(subChildren[0].label).to.equal("subfolder");
        });

        it("should group files in the same folder", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/folder/file1.txt",
                    remotePath: "/remote/folder/file1.txt",
                    relativePath: "folder/file1.txt",
                    status: "modified"
                },
                {
                    localPath: "/local/folder/file2.txt",
                    remotePath: "/remote/folder/file2.txt",
                    relativePath: "folder/file2.txt",
                    status: "added"
                }
            ];
            const treeItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFolderTreeItem);

            const folderItem = children[0] as MetadataDiffFolderTreeItem;
            const folderChildren = folderItem.getChildren();

            expect(folderChildren).to.have.lengthOf(2);
        });

        it("should handle mixed root files and folders", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/root-file.txt",
                    remotePath: "/remote/root-file.txt",
                    relativePath: "root-file.txt",
                    status: "modified"
                },
                {
                    localPath: "/local/folder/nested-file.txt",
                    remotePath: "/remote/folder/nested-file.txt",
                    relativePath: "folder/nested-file.txt",
                    status: "added"
                }
            ];
            const treeItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(2);

            const fileItem = children.find(c => c instanceof MetadataDiffFileTreeItem);
            const folderItem = children.find(c => c instanceof MetadataDiffFolderTreeItem);

            expect(fileItem).to.not.be.undefined;
            expect(folderItem).to.not.be.undefined;
        });

        it("should handle backslash path separators", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "C:\\local\\folder\\file.txt",
                    remotePath: "C:\\remote\\folder\\file.txt",
                    relativePath: "folder\\file.txt",
                    status: "modified"
                }
            ];
            const treeItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFolderTreeItem);
            expect(children[0].label).to.equal("folder");
        });
    });
});
