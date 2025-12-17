/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { MetadataDiffFileTreeItem, METADATA_DIFF_URI_SCHEME } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFileTreeItem";
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
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the file name as label", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            expect(treeItem.label).to.equal("file.txt");
        });

        it("should extract file name from path with multiple folders", () => {
            const result: IFileComparisonResult = {
                ...mockComparisonResult,
                relativePath: "folder/subfolder/myfile.txt"
            };
            const treeItem = new MetadataDiffFileTreeItem(result, "Test Site");

            expect(treeItem.label).to.equal("myfile.txt");
        });

        it("should have None collapsible state", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.None);
        });

        it("should have the expected context value", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_FILE);
        });
    });

    describe("resourceUri", () => {
        it("should have resourceUri with custom scheme", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            expect(treeItem.resourceUri).to.not.be.undefined;
            expect(treeItem.resourceUri?.scheme).to.equal(METADATA_DIFF_URI_SCHEME);
        });

        it("should have relativePath as URI path", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            expect(treeItem.resourceUri?.path).to.equal("folder/file.txt");
        });

        it("should encode status in query string for modified files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "modified" };
            const treeItem = new MetadataDiffFileTreeItem(result, "Test Site");

            expect(treeItem.resourceUri?.query).to.equal("status=modified");
        });

        it("should encode status in query string for added files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "added" };
            const treeItem = new MetadataDiffFileTreeItem(result, "Test Site");

            expect(treeItem.resourceUri?.query).to.equal("status=added");
        });

        it("should encode status in query string for deleted files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "deleted" };
            const treeItem = new MetadataDiffFileTreeItem(result, "Test Site");

            expect(treeItem.resourceUri?.query).to.equal("status=deleted");
        });
    });

    describe("description", () => {
        it("should show folder path in list view mode", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            // In list view (default), description should contain the folder path
            expect(treeItem.description).to.equal("folder");
        });

        it("should show full folder path for nested files in list view", () => {
            const result: IFileComparisonResult = {
                ...mockComparisonResult,
                relativePath: "folder/subfolder/deep/file.txt"
            };
            const treeItem = new MetadataDiffFileTreeItem(result, "Test Site");

            expect(treeItem.description).to.equal("folder/subfolder/deep");
        });

        it("should have empty description for root files", () => {
            const result: IFileComparisonResult = {
                ...mockComparisonResult,
                relativePath: "root-file.txt"
            };
            const treeItem = new MetadataDiffFileTreeItem(result, "Test Site");

            expect(treeItem.description).to.equal("");
        });
    });

    describe("command", () => {
        it("should have command set to open diff file", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            expect(treeItem.command).to.not.be.undefined;
            expect(treeItem.command?.command).to.equal(Constants.Commands.METADATA_DIFF_OPEN_FILE);
        });

        it("should have the tree item as argument in command", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            expect(treeItem.command?.arguments).to.have.lengthOf(1);
            expect(treeItem.command?.arguments?.[0]).to.equal(treeItem);
        });
    });

    describe("comparisonResult", () => {
        it("should return the comparison result", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            expect(treeItem.comparisonResult).to.deep.equal(mockComparisonResult);
        });
    });

    describe("siteName", () => {
        it("should return the site name", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "My Site");

            expect(treeItem.siteName).to.equal("My Site");
        });
    });

    describe("tooltip", () => {
        it("should have tooltip with local path and status", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "modified" };
            const treeItem = new MetadataDiffFileTreeItem(result, "Test Site");

            expect(treeItem.tooltip).to.be.instanceOf(vscode.MarkdownString);
            const tooltipValue = (treeItem.tooltip as vscode.MarkdownString).value;
            expect(tooltipValue).to.include("/local/file.txt");
            expect(tooltipValue).to.include("Modified");
        });

        it("should show Added status in tooltip for added files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "added" };
            const treeItem = new MetadataDiffFileTreeItem(result, "Test Site");

            const tooltipValue = (treeItem.tooltip as vscode.MarkdownString).value;
            expect(tooltipValue).to.include("Added");
        });

        it("should show Deleted status in tooltip for deleted files", () => {
            const result: IFileComparisonResult = { ...mockComparisonResult, status: "deleted" };
            const treeItem = new MetadataDiffFileTreeItem(result, "Test Site");

            const tooltipValue = (treeItem.tooltip as vscode.MarkdownString).value;
            expect(tooltipValue).to.include("Deleted");
        });
    });

    describe("isImported", () => {
        it("should return false by default", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site");

            expect(treeItem.isImported).to.be.false;
        });

        it("should return false when explicitly set to false", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site", false);

            expect(treeItem.isImported).to.be.false;
        });

        it("should return true when explicitly set to true", () => {
            const treeItem = new MetadataDiffFileTreeItem(mockComparisonResult, "Test Site", true);

            expect(treeItem.isImported).to.be.true;
        });
    });
});
