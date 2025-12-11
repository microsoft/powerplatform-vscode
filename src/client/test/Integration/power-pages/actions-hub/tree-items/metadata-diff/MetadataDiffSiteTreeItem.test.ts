/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { MetadataDiffSiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { MetadataDiffFileTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFileTreeItem";
import { MetadataDiffFolderTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFolderTreeItem";
import { ActionsHubTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { IFileComparisonResult } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";
import MetadataDiffContext, { MetadataDiffViewMode } from "../../../../../../power-pages/actions-hub/MetadataDiffContext";

describe("MetadataDiffSiteTreeItem", () => {
    beforeEach(() => {
        // Reset to default list view mode before each test
        MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
    });

    describe("constructor", () => {
        it("should be an instance of ActionsHubTreeItem", () => {
            const treeItem = new MetadataDiffSiteTreeItem([], "Test Site", "Test Environment");

            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the expected label with site name and change count", () => {
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
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

            expect(treeItem.label).to.include("Test Site");
            expect(treeItem.label).to.include("2");
        });

        it("should have expanded collapsible state", () => {
            const treeItem = new MetadataDiffSiteTreeItem([], "Test Site", "Test Environment");

            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Expanded);
        });

        it("should have the globe icon", () => {
            const treeItem = new MetadataDiffSiteTreeItem([], "Test Site", "Test Environment");

            expect((treeItem.iconPath as vscode.ThemeIcon).id).to.equal("globe");
        });

        it("should have the expected context value", () => {
            const treeItem = new MetadataDiffSiteTreeItem([], "Test Site", "Test Environment");

            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_SITE);
        });
    });

    describe("siteName", () => {
        it("should return the site name", () => {
            const treeItem = new MetadataDiffSiteTreeItem([], "Test Site", "Test Environment");

            expect(treeItem.siteName).to.equal("Test Site");
        });
    });

    describe("environmentName", () => {
        it("should return the environment name", () => {
            const treeItem = new MetadataDiffSiteTreeItem([], "Test Site", "My Environment");

            expect(treeItem.environmentName).to.equal("My Environment");
        });

        it("should show environment name as description", () => {
            const treeItem = new MetadataDiffSiteTreeItem([], "Test Site", "My Environment");

            expect(treeItem.description).to.equal("My Environment");
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
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

            expect(treeItem.comparisonResults).to.deep.equal(results);
        });
    });

    describe("getChildren - list view mode", () => {
        beforeEach(() => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
        });

        it("should return empty array when no results", () => {
            const treeItem = new MetadataDiffSiteTreeItem([], "Test Site", "Test Environment");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(0);
        });

        it("should return file items as flat list", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFileTreeItem);
        });

        it("should return file items directly without folder hierarchy", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/folder/file.txt",
                    remotePath: "/remote/folder/file.txt",
                    relativePath: "folder/file.txt",
                    status: "modified"
                }
            ];
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFileTreeItem);
            expect(children[0].label).to.equal("file.txt");
        });

        it("should show folder path in description", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/folder/subfolder/file.txt",
                    remotePath: "/remote/folder/subfolder/file.txt",
                    relativePath: "folder/subfolder/file.txt",
                    status: "modified"
                }
            ];
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFileTreeItem);
            expect(children[0].description).to.equal("folder/subfolder");
        });

        it("should return all files in flat list", () => {
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
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(2);
            expect(children[0]).to.be.instanceOf(MetadataDiffFileTreeItem);
            expect(children[1]).to.be.instanceOf(MetadataDiffFileTreeItem);
        });

        it("should sort files by relative path", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/z-folder/file.txt",
                    remotePath: "/remote/z-folder/file.txt",
                    relativePath: "z-folder/file.txt",
                    status: "modified"
                },
                {
                    localPath: "/local/a-folder/file.txt",
                    remotePath: "/remote/a-folder/file.txt",
                    relativePath: "a-folder/file.txt",
                    status: "added"
                }
            ];
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(2);
            expect((children[0] as MetadataDiffFileTreeItem).comparisonResult.relativePath).to.equal("a-folder/file.txt");
            expect((children[1] as MetadataDiffFileTreeItem).comparisonResult.relativePath).to.equal("z-folder/file.txt");
        });
    });

    describe("getChildren - tree view mode", () => {
        beforeEach(() => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.Tree);
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
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

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
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

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
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

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
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

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
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

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
            const treeItem = new MetadataDiffSiteTreeItem(results, "Test Site", "Test Environment");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFolderTreeItem);
            expect(children[0].label).to.equal("folder");
        });
    });
});
