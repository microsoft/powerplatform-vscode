/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { MetadataDiffFolderTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFolderTreeItem";
import { MetadataDiffFileTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFileTreeItem";
import { ActionsHubTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { IFileComparisonResult } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";

describe("MetadataDiffFolderTreeItem", () => {
    describe("constructor", () => {
        it("should be an instance of ActionsHubTreeItem", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");

            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the expected label", () => {
            const treeItem = new MetadataDiffFolderTreeItem("myFolder", "Test Site", "myFolder");

            expect(treeItem.label).to.equal("myFolder");
        });

        it("should have Expanded collapsible state", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");

            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Expanded);
        });

        it("should have the folder icon", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");

            expect((treeItem.iconPath as vscode.ThemeIcon).id).to.equal("folder");
        });

        it("should have the expected context value", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");

            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_FOLDER);
        });

        it("should have imported context value when isImported is true", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder", true);

            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_FOLDER_IMPORTED);
        });

        it("should have empty children map initially", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");

            expect(treeItem.childrenMap.size).to.equal(0);
        });

        it("should store siteName and folderPath", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "root/folder");

            expect(treeItem.siteName).to.equal("Test Site");
            expect(treeItem.folderPath).to.equal("root/folder");
        });

        it("should have isImported default to false", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");

            expect(treeItem.isImported).to.be.false;
        });

        it("should store isImported when provided", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder", true);

            expect(treeItem.isImported).to.be.true;
        });
    });

    describe("childrenMap", () => {
        it("should allow adding file children", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "folder/file.txt",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            treeItem.childrenMap.set("file.txt", fileItem);

            expect(treeItem.childrenMap.size).to.equal(1);
            expect(treeItem.childrenMap.get("file.txt")).to.equal(fileItem);
        });

        it("should allow adding folder children", () => {
            const treeItem = new MetadataDiffFolderTreeItem("parent", "Test Site", "parent");
            const childFolder = new MetadataDiffFolderTreeItem("child", "Test Site", "parent/child");

            treeItem.childrenMap.set("child", childFolder);

            expect(treeItem.childrenMap.size).to.equal(1);
            expect(treeItem.childrenMap.get("child")).to.equal(childFolder);
        });

        it("should allow adding mixed children", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");
            const childFolder = new MetadataDiffFolderTreeItem("subfolder", "Test Site", "folder/subfolder");
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "folder/file.txt",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            treeItem.childrenMap.set("subfolder", childFolder);
            treeItem.childrenMap.set("file.txt", fileItem);

            expect(treeItem.childrenMap.size).to.equal(2);
        });
    });

    describe("getChildren", () => {
        it("should return empty array when no children", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(0);
        });

        it("should return all children from childrenMap", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");
            const childFolder = new MetadataDiffFolderTreeItem("subfolder", "Test Site", "folder/subfolder");
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "folder/file.txt",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            treeItem.childrenMap.set("subfolder", childFolder);
            treeItem.childrenMap.set("file.txt", fileItem);

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(2);
            expect(children).to.include(childFolder);
            expect(children).to.include(fileItem);
        });

        it("should return folders first alphabetically, then files alphabetically", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");

            // Add folders in non-alphabetical order
            const folderZ = new MetadataDiffFolderTreeItem("z-folder", "Test Site", "folder/z-folder");
            const folderA = new MetadataDiffFolderTreeItem("a-folder", "Test Site", "folder/a-folder");
            const folderM = new MetadataDiffFolderTreeItem("m-folder", "Test Site", "folder/m-folder");

            // Add files in non-alphabetical order
            const fileZ: IFileComparisonResult = {
                localPath: "/local/z-file.txt",
                remotePath: "/remote/z-file.txt",
                relativePath: "folder/z-file.txt",
                status: "modified"
            };
            const fileA: IFileComparisonResult = {
                localPath: "/local/a-file.txt",
                remotePath: "/remote/a-file.txt",
                relativePath: "folder/a-file.txt",
                status: "added"
            };
            const fileM: IFileComparisonResult = {
                localPath: "/local/m-file.txt",
                remotePath: "/remote/m-file.txt",
                relativePath: "folder/m-file.txt",
                status: "deleted"
            };

            // Add in random order
            treeItem.childrenMap.set("z-file.txt", new MetadataDiffFileTreeItem(fileZ, "Test Site"));
            treeItem.childrenMap.set("z-folder", folderZ);
            treeItem.childrenMap.set("a-file.txt", new MetadataDiffFileTreeItem(fileA, "Test Site"));
            treeItem.childrenMap.set("m-folder", folderM);
            treeItem.childrenMap.set("m-file.txt", new MetadataDiffFileTreeItem(fileM, "Test Site"));
            treeItem.childrenMap.set("a-folder", folderA);

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(6);

            // First 3 should be folders in alphabetical order
            expect(children[0]).to.be.instanceOf(MetadataDiffFolderTreeItem);
            expect(children[0].label).to.equal("a-folder");
            expect(children[1]).to.be.instanceOf(MetadataDiffFolderTreeItem);
            expect(children[1].label).to.equal("m-folder");
            expect(children[2]).to.be.instanceOf(MetadataDiffFolderTreeItem);
            expect(children[2].label).to.equal("z-folder");

            // Last 3 should be files in alphabetical order
            expect(children[3]).to.be.instanceOf(MetadataDiffFileTreeItem);
            expect(children[3].label).to.equal("a-file.txt");
            expect(children[4]).to.be.instanceOf(MetadataDiffFileTreeItem);
            expect(children[4].label).to.equal("m-file.txt");
            expect(children[5]).to.be.instanceOf(MetadataDiffFileTreeItem);
            expect(children[5].label).to.equal("z-file.txt");
        });

        it("should return ActionsHubTreeItem array", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "folder/file.txt",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            treeItem.childrenMap.set("file.txt", fileItem);

            const children = treeItem.getChildren();

            children.forEach(child => {
                expect(child).to.be.instanceOf(ActionsHubTreeItem);
            });
        });
    });

    describe("getAllFileItems", () => {
        it("should return empty array when no children", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");

            const files = treeItem.getAllFileItems();

            expect(files).to.have.lengthOf(0);
        });

        it("should return direct file children", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder", "Test Site", "folder");
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "folder/file.txt",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");
            treeItem.childrenMap.set("file.txt", fileItem);

            const files = treeItem.getAllFileItems();

            expect(files).to.have.lengthOf(1);
            expect(files[0]).to.equal(fileItem);
        });

        it("should return files from nested folders recursively", () => {
            const rootFolder = new MetadataDiffFolderTreeItem("root", "Test Site", "root");
            const childFolder = new MetadataDiffFolderTreeItem("child", "Test Site", "root/child");
            const comparisonResult1: IFileComparisonResult = {
                localPath: "/local/file1.txt",
                remotePath: "/remote/file1.txt",
                relativePath: "root/file1.txt",
                status: "modified"
            };
            const comparisonResult2: IFileComparisonResult = {
                localPath: "/local/file2.txt",
                remotePath: "/remote/file2.txt",
                relativePath: "root/child/file2.txt",
                status: "added"
            };
            const fileItem1 = new MetadataDiffFileTreeItem(comparisonResult1, "Test Site");
            const fileItem2 = new MetadataDiffFileTreeItem(comparisonResult2, "Test Site");

            childFolder.childrenMap.set("file2.txt", fileItem2);
            rootFolder.childrenMap.set("file1.txt", fileItem1);
            rootFolder.childrenMap.set("child", childFolder);

            const files = rootFolder.getAllFileItems();

            expect(files).to.have.lengthOf(2);
            expect(files).to.include(fileItem1);
            expect(files).to.include(fileItem2);
        });
    });

    describe("nested folders", () => {
        it("should support deeply nested folder structure", () => {
            const rootFolder = new MetadataDiffFolderTreeItem("root", "Test Site", "root");
            const level1Folder = new MetadataDiffFolderTreeItem("level1", "Test Site", "root/level1");
            const level2Folder = new MetadataDiffFolderTreeItem("level2", "Test Site", "root/level1/level2");
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "root/level1/level2/file.txt",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            level2Folder.childrenMap.set("file.txt", fileItem);
            level1Folder.childrenMap.set("level2", level2Folder);
            rootFolder.childrenMap.set("level1", level1Folder);

            const rootChildren = rootFolder.getChildren();
            expect(rootChildren).to.have.lengthOf(1);
            expect(rootChildren[0]).to.equal(level1Folder);

            const level1Children = (rootChildren[0] as MetadataDiffFolderTreeItem).getChildren();
            expect(level1Children).to.have.lengthOf(1);
            expect(level1Children[0]).to.equal(level2Folder);

            const level2Children = (level1Children[0] as MetadataDiffFolderTreeItem).getChildren();
            expect(level2Children).to.have.lengthOf(1);
            expect(level2Children[0]).to.equal(fileItem);
        });
    });
});
