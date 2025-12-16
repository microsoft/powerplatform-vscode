/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { MetadataDiffGroupTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffGroupTreeItem";
import { MetadataDiffSiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { ActionsHubTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { IFileComparisonResult } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";
import MetadataDiffContext, { MetadataDiffViewMode } from "../../../../../../power-pages/actions-hub/MetadataDiffContext";

describe("MetadataDiffGroupTreeItem", () => {
    beforeEach(() => {
        // Reset to default list view mode before each test
        MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
        // Clear all site results before each test
        MetadataDiffContext.clear();
    });

    afterEach(() => {
        // Clean up after each test
        MetadataDiffContext.clear();
    });

    describe("constructor", () => {
        it("should be an instance of ActionsHubTreeItem", () => {
            const treeItem = new MetadataDiffGroupTreeItem();

            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the base label when no results", () => {
            const treeItem = new MetadataDiffGroupTreeItem();

            expect(treeItem.label).to.equal("Metadata Diff");
        });

        it("should have the same label even when results exist", () => {
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
            MetadataDiffContext.setResults(results, "Test Site", "Test Environment");
            const treeItem = new MetadataDiffGroupTreeItem();

            expect(treeItem.label).to.equal("Metadata Diff");
        });

        it("should have None collapsible state when no results", () => {
            const treeItem = new MetadataDiffGroupTreeItem();

            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.None);
        });

        it("should have expanded state when results exist", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file1.txt",
                    remotePath: "/remote/file1.txt",
                    relativePath: "file1.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Test Environment");
            const treeItem = new MetadataDiffGroupTreeItem();

            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Expanded);
        });

        it("should have the diff icon", () => {
            const treeItem = new MetadataDiffGroupTreeItem();

            expect((treeItem.iconPath as vscode.ThemeIcon).id).to.equal("diff");
        });

        it("should have METADATA_DIFF_GROUP context value when no results", () => {
            const treeItem = new MetadataDiffGroupTreeItem();

            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_GROUP);
        });

        it("should have METADATA_DIFF_GROUP_WITH_RESULTS context value when results exist", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Test Environment");
            const treeItem = new MetadataDiffGroupTreeItem();

            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_GROUP_WITH_RESULTS);
        });

        it("should have id without results suffix when no results", () => {
            const treeItem = new MetadataDiffGroupTreeItem();

            expect(treeItem.id).to.equal("metadataDiffGroup-noResults");
        });

        it("should have id with results suffix when results exist", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Test Environment");
            const treeItem = new MetadataDiffGroupTreeItem();

            expect(treeItem.id).to.equal("metadataDiffGroup-withResults");
        });
    });

    describe("getChildren", () => {
        it("should return empty array when no results", () => {
            const treeItem = new MetadataDiffGroupTreeItem();

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(0);
        });

        it("should return site tree items for each site's results", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Test Environment");
            const treeItem = new MetadataDiffGroupTreeItem();

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffSiteTreeItem);
        });

        it("should return multiple site tree items when multiple sites have results", () => {
            const results1: IFileComparisonResult[] = [
                {
                    localPath: "/local/file1.txt",
                    remotePath: "/remote/file1.txt",
                    relativePath: "file1.txt",
                    status: "modified"
                }
            ];
            const results2: IFileComparisonResult[] = [
                {
                    localPath: "/local/file2.txt",
                    remotePath: "/remote/file2.txt",
                    relativePath: "file2.txt",
                    status: "added"
                }
            ];
            MetadataDiffContext.setResults(results1, "Site 1", "Test Environment");
            MetadataDiffContext.setResults(results2, "Site 2", "Test Environment");
            const treeItem = new MetadataDiffGroupTreeItem();

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(2);
            expect(children[0]).to.be.instanceOf(MetadataDiffSiteTreeItem);
            expect(children[1]).to.be.instanceOf(MetadataDiffSiteTreeItem);
        });

        it("should replace existing site results when same site is compared again", () => {
            const results1: IFileComparisonResult[] = [
                {
                    localPath: "/local/file1.txt",
                    remotePath: "/remote/file1.txt",
                    relativePath: "file1.txt",
                    status: "modified"
                }
            ];
            const results2: IFileComparisonResult[] = [
                {
                    localPath: "/local/file2.txt",
                    remotePath: "/remote/file2.txt",
                    relativePath: "file2.txt",
                    status: "added"
                },
                {
                    localPath: "/local/file3.txt",
                    remotePath: "/remote/file3.txt",
                    relativePath: "file3.txt",
                    status: "deleted"
                }
            ];
            MetadataDiffContext.setResults(results1, "Test Site", "Test Environment");
            MetadataDiffContext.setResults(results2, "Test Site", "Test Environment");
            const treeItem = new MetadataDiffGroupTreeItem();

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            const siteItem = children[0] as MetadataDiffSiteTreeItem;
            expect(siteItem.comparisonResults).to.have.lengthOf(2);
        });
    });
});
