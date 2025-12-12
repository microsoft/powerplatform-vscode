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
            const treeItem = new MetadataDiffFolderTreeItem("folder");

            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the expected label", () => {
            const treeItem = new MetadataDiffFolderTreeItem("myFolder");

            expect(treeItem.label).to.equal("myFolder");
        });

        it("should have Expanded collapsible state", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder");

            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Expanded);
        });

        it("should have the folder icon", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder");

            expect((treeItem.iconPath as vscode.ThemeIcon).id).to.equal("folder");
        });

        it("should have the expected context value", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder");

            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_FOLDER);
        });

        it("should have empty children map initially", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder");

            expect(treeItem.childrenMap.size).to.equal(0);
        });
    });

    describe("childrenMap", () => {
        it("should allow adding file children", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder");
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
            const treeItem = new MetadataDiffFolderTreeItem("parent");
            const childFolder = new MetadataDiffFolderTreeItem("child");

            treeItem.childrenMap.set("child", childFolder);

            expect(treeItem.childrenMap.size).to.equal(1);
            expect(treeItem.childrenMap.get("child")).to.equal(childFolder);
        });

        it("should allow adding mixed children", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder");
            const childFolder = new MetadataDiffFolderTreeItem("subfolder");
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
            const treeItem = new MetadataDiffFolderTreeItem("folder");

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(0);
        });

        it("should return all children from childrenMap", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder");
            const childFolder = new MetadataDiffFolderTreeItem("subfolder");
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

        it("should return ActionsHubTreeItem array", () => {
            const treeItem = new MetadataDiffFolderTreeItem("folder");
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

    describe("nested folders", () => {
        it("should support deeply nested folder structure", () => {
            const rootFolder = new MetadataDiffFolderTreeItem("root");
            const level1Folder = new MetadataDiffFolderTreeItem("level1");
            const level2Folder = new MetadataDiffFolderTreeItem("level2");
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
