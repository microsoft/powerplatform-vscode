/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { MetadataDiffFileTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFileTreeItem";
import { ActionsHubTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { IFileComparisonResult } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";

describe("MetadataDiffFileTreeItem", () => {
    let mockComparisonResult: IFileComparisonResult;

    beforeEach(() => {
        mockComparisonResult = {
            localPath: "/local/file.txt",
            remotePath: "/remote/file.txt",
            relativePath: "folder/file.txt",
            status: "modified"
        };
    });

    describe("constructor", () => {
        it("should be an instance of ActionsHubTreeItem", () => {
            const treeItem = new MetadataDiffFileTreeItem("file.txt", mockComparisonResult, "Test Site");

            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the expected label", () => {
            const treeItem = new MetadataDiffFileTreeItem("myfile.txt", mockComparisonResult, "Test Site");

            expect(treeItem.label).to.equal("myfile.txt");
        });

        it("should have None collapsible state", () => {
            const treeItem = new MetadataDiffFileTreeItem("file.txt", mockComparisonResult, "Test Site");

            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.None);
        });

        it("should have the expected context value", () => {
            const treeItem = new MetadataDiffFileTreeItem("file.txt", mockComparisonResult, "Test Site");

            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_FILE);
        });
    });

    describe("icon", () => {
        it("should have diff-modified icon for modified files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "modified" };
            const treeItem = new MetadataDiffFileTreeItem("file.txt", result, "Test Site");

            expect((treeItem.iconPath as vscode.ThemeIcon).id).to.equal("diff-modified");
        });

        it("should have diff-added icon for added files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "added" };
            const treeItem = new MetadataDiffFileTreeItem("file.txt", result, "Test Site");

            expect((treeItem.iconPath as vscode.ThemeIcon).id).to.equal("diff-added");
        });

        it("should have diff-removed icon for deleted files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "deleted" };
            const treeItem = new MetadataDiffFileTreeItem("file.txt", result, "Test Site");

            expect((treeItem.iconPath as vscode.ThemeIcon).id).to.equal("diff-removed");
        });
    });

    describe("description", () => {
        it("should have Modified description for modified files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "modified" };
            const treeItem = new MetadataDiffFileTreeItem("file.txt", result, "Test Site");

            expect(treeItem.description).to.equal(Constants.Strings.METADATA_DIFF_MODIFIED);
        });

        it("should have Added locally description for added files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "added" };
            const treeItem = new MetadataDiffFileTreeItem("file.txt", result, "Test Site");

            expect(treeItem.description).to.equal(Constants.Strings.METADATA_DIFF_ADDED);
        });

        it("should have Deleted locally description for deleted files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "deleted" };
            const treeItem = new MetadataDiffFileTreeItem("file.txt", result, "Test Site");

            expect(treeItem.description).to.equal(Constants.Strings.METADATA_DIFF_DELETED);
        });
    });

    describe("command", () => {
        it("should have command set to open diff file", () => {
            const treeItem = new MetadataDiffFileTreeItem("file.txt", mockComparisonResult, "Test Site");

            expect(treeItem.command).to.not.be.undefined;
            expect(treeItem.command?.command).to.equal(Constants.Commands.METADATA_DIFF_OPEN_FILE);
        });

        it("should have the tree item as argument in command", () => {
            const treeItem = new MetadataDiffFileTreeItem("file.txt", mockComparisonResult, "Test Site");

            expect(treeItem.command?.arguments).to.have.lengthOf(1);
            expect(treeItem.command?.arguments?.[0]).to.equal(treeItem);
        });
    });

    describe("comparisonResult", () => {
        it("should return the comparison result", () => {
            const treeItem = new MetadataDiffFileTreeItem("file.txt", mockComparisonResult, "Test Site");

            expect(treeItem.comparisonResult).to.deep.equal(mockComparisonResult);
        });
    });

    describe("siteName", () => {
        it("should return the site name", () => {
            const treeItem = new MetadataDiffFileTreeItem("file.txt", mockComparisonResult, "My Site");

            expect(treeItem.siteName).to.equal("My Site");
        });
    });
});
