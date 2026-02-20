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
import { IFileComparisonResult, FileComparisonStatus, ISiteComparisonResults } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";
import MetadataDiffContext, { MetadataDiffViewMode, MetadataDiffSortMode } from "../../../../../../power-pages/actions-hub/MetadataDiffContext";
import { SiteVisibility } from "../../../../../../power-pages/actions-hub/models/SiteVisibility";

/**
 * Helper function to create ISiteComparisonResults for testing
 */
function createSiteResults(
    comparisonResults: IFileComparisonResult[],
    siteName = "Test Site",
    localSiteName = "Local Test Site",
    environmentName = "Test Environment",
    websiteId = "test-website-id",
    environmentId = "test-environment-id",
    isImported = false,
    exportedAt?: string,
    dataModelVersion: 1 | 2 = 2,
    websiteUrl = "https://test-site.powerappsportals.com",
    siteVisibility = SiteVisibility.Public,
    creator = "test-creator@contoso.com",
    createdOn = "2024-01-15T10:30:00Z",
    isCodeSite = false
): ISiteComparisonResults {
    return {
        comparisonResults,
        siteName,
        localSiteName,
        environmentName,
        websiteId,
        environmentId,
        isImported,
        exportedAt,
        dataModelVersion,
        websiteUrl,
        siteVisibility,
        creator,
        createdOn,
        isCodeSite
    };
}

describe("MetadataDiffSiteTreeItem", () => {
    beforeEach(() => {
        // Reset to default list view mode before each test
        MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
    });

    describe("constructor", () => {
        it("should be an instance of ActionsHubTreeItem", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([]));

            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the expected label with site name", () => {
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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            expect(treeItem.label).to.include("Test Site");
            expect(treeItem.label).to.include("Test Environment");
            expect(treeItem.label).to.include("Local Test Site");
        });

        it("should have expanded collapsible state", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([]));

            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Expanded);
        });

        it("should have the globe icon", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([]));

            expect((treeItem.iconPath as vscode.ThemeIcon).id).to.equal("globe");
        });

        it("should have the expected context value", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([]));

            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_SITE);
        });

        it("should have imported icon and context value for imported comparisons", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([], "Test Site", "Local Test Site", "Test Environment", "web-id", "env-id", true, "2024-01-15T10:30:00Z"));

            expect((treeItem.iconPath as vscode.ThemeIcon).id).to.equal("cloud-download");
            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_SITE_IMPORTED);
        });

        it("should store exportedAt for imported comparisons", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([
                {
                    localPath: "/local/file1.txt",
                    remotePath: "/remote/file1.txt",
                    relativePath: "file1.txt",
                    status: "modified"
                }
            ], "Test Site", "Local Test Site", "Test Environment", "web-id", "env-id", true, "2024-01-15T10:30:00Z"));

            expect(treeItem.exportedAt).to.equal("2024-01-15T10:30:00Z");
        });
    });

    describe("siteName", () => {
        it("should return the site name", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([]));

            expect(treeItem.siteName).to.equal("Test Site");
        });
    });

    describe("environmentName", () => {
        it("should return the environment name", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([], "Test Site", "Local Test Site", "My Environment"));

            expect(treeItem.environmentName).to.equal("My Environment");
        });

        it("should show file count as description", () => {
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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results, "Test Site", "Local Test Site", "My Environment"));

            expect(treeItem.description).to.include("2");
            expect(treeItem.description).to.include("files changed");
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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            expect(treeItem.comparisonResults).to.deep.equal(results);
        });
    });

    describe("websiteId and environmentId", () => {
        it("should return the websiteId", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([], "Test Site", "Local Test Site", "Test Environment", "my-website-id", "my-env-id"));

            expect(treeItem.websiteId).to.equal("my-website-id");
        });

        it("should return the environmentId", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([], "Test Site", "Local Test Site", "Test Environment", "my-website-id", "my-env-id"));

            expect(treeItem.environmentId).to.equal("my-env-id");
        });
    });

    describe("site details", () => {
        it("should return the dataModelVersion", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([], "Test Site", "Local Test Site", "Test Environment", "web-id", "env-id", false, undefined, 2));

            expect(treeItem.dataModelVersion).to.equal(2);
        });

        it("should return the websiteUrl", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([], "Test Site", "Local Test Site", "Test Environment", "web-id", "env-id", false, undefined, 2, "https://my-site.powerappsportals.com"));

            expect(treeItem.websiteUrl).to.equal("https://my-site.powerappsportals.com");
        });

        it("should return the siteVisibility", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([], "Test Site", "Local Test Site", "Test Environment", "web-id", "env-id", false, undefined, 2, "https://my-site.powerappsportals.com", SiteVisibility.Private));

            expect(treeItem.siteVisibility).to.equal(SiteVisibility.Private);
        });

        it("should return the creator", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([], "Test Site", "Local Test Site", "Test Environment", "web-id", "env-id", false, undefined, 2, "https://my-site.powerappsportals.com", SiteVisibility.Public, "admin@contoso.com"));

            expect(treeItem.creator).to.equal("admin@contoso.com");
        });

        it("should return the createdOn", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([], "Test Site", "Local Test Site", "Test Environment", "web-id", "env-id", false, undefined, 2, "https://my-site.powerappsportals.com", SiteVisibility.Public, "admin@contoso.com", "2024-06-01T12:00:00Z"));

            expect(treeItem.createdOn).to.equal("2024-06-01T12:00:00Z");
        });

        it("should handle undefined optional fields", () => {
            const results: ISiteComparisonResults = {
                comparisonResults: [],
                siteName: "Test Site",
                localSiteName: "Local Test Site",
                environmentName: "Test Environment",
                websiteId: "web-id",
                environmentId: "env-id"
            };
            const treeItem = new MetadataDiffSiteTreeItem(results);

            expect(treeItem.dataModelVersion).to.be.undefined;
            expect(treeItem.websiteUrl).to.be.undefined;
            expect(treeItem.siteVisibility).to.be.undefined;
            expect(treeItem.creator).to.be.undefined;
            expect(treeItem.createdOn).to.be.undefined;
        });
    });

    describe("getChildren - list view mode", () => {
        beforeEach(() => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
        });

        it("should return empty array when no results", () => {
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults([]));

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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(2);
            expect((children[0] as MetadataDiffFileTreeItem).comparisonResult.relativePath).to.equal("a-folder/file.txt");
            expect((children[1] as MetadataDiffFileTreeItem).comparisonResult.relativePath).to.equal("z-folder/file.txt");
        });
    });

    describe("getChildren - list view sorting", () => {
        beforeEach(() => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
        });

        it("should sort by path when sort mode is path", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Path);
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/z-folder/file.txt",
                    remotePath: "/remote/z-folder/file.txt",
                    relativePath: "z-folder/file.txt",
                    status: FileComparisonStatus.MODIFIED
                },
                {
                    localPath: "/local/a-folder/file.txt",
                    remotePath: "/remote/a-folder/file.txt",
                    relativePath: "a-folder/file.txt",
                    status: FileComparisonStatus.ADDED
                }
            ];
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(2);
            expect((children[0] as MetadataDiffFileTreeItem).comparisonResult.relativePath).to.equal("a-folder/file.txt");
            expect((children[1] as MetadataDiffFileTreeItem).comparisonResult.relativePath).to.equal("z-folder/file.txt");
        });

        it("should sort by file name when sort mode is name", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Name);
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/a-folder/zebra.txt",
                    remotePath: "/remote/a-folder/zebra.txt",
                    relativePath: "a-folder/zebra.txt",
                    status: FileComparisonStatus.MODIFIED
                },
                {
                    localPath: "/local/z-folder/apple.txt",
                    remotePath: "/remote/z-folder/apple.txt",
                    relativePath: "z-folder/apple.txt",
                    status: FileComparisonStatus.ADDED
                }
            ];
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(2);
            // Sorted by file name: apple.txt comes before zebra.txt
            expect((children[0] as MetadataDiffFileTreeItem).comparisonResult.relativePath).to.equal("z-folder/apple.txt");
            expect((children[1] as MetadataDiffFileTreeItem).comparisonResult.relativePath).to.equal("a-folder/zebra.txt");
        });

        it("should sort by status when sort mode is status", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Status);
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file3.txt",
                    remotePath: "/remote/file3.txt",
                    relativePath: "file3.txt",
                    status: FileComparisonStatus.MODIFIED
                },
                {
                    localPath: "/local/file1.txt",
                    remotePath: "/remote/file1.txt",
                    relativePath: "file1.txt",
                    status: FileComparisonStatus.ADDED
                },
                {
                    localPath: "/local/file2.txt",
                    remotePath: "/remote/file2.txt",
                    relativePath: "file2.txt",
                    status: FileComparisonStatus.DELETED
                }
            ];
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(3);
            // Sorted by status: Added, Deleted, Modified
            expect((children[0] as MetadataDiffFileTreeItem).comparisonResult.status).to.equal(FileComparisonStatus.ADDED);
            expect((children[1] as MetadataDiffFileTreeItem).comparisonResult.status).to.equal(FileComparisonStatus.DELETED);
            expect((children[2] as MetadataDiffFileTreeItem).comparisonResult.status).to.equal(FileComparisonStatus.MODIFIED);
        });

        it("should sort by path within same status when sort mode is status", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Status);
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/z-file.txt",
                    remotePath: "/remote/z-file.txt",
                    relativePath: "z-file.txt",
                    status: FileComparisonStatus.ADDED
                },
                {
                    localPath: "/local/a-file.txt",
                    remotePath: "/remote/a-file.txt",
                    relativePath: "a-file.txt",
                    status: FileComparisonStatus.ADDED
                }
            ];
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(2);
            // Both are added, so should be sorted by path: a-file.txt before z-file.txt
            expect((children[0] as MetadataDiffFileTreeItem).comparisonResult.relativePath).to.equal("a-file.txt");
            expect((children[1] as MetadataDiffFileTreeItem).comparisonResult.relativePath).to.equal("z-file.txt");
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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFolderTreeItem);

            const folderItem = children[0] as MetadataDiffFolderTreeItem;
            const folderChildren = folderItem.getChildren();

            expect(folderChildren).to.have.lengthOf(2);
        });

        it("should handle mixed root files and folders with folders first alphabetically, then files", () => {
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
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(2);

            // Folders should come first, then files
            expect(children[0]).to.be.instanceOf(MetadataDiffFolderTreeItem);
            expect(children[0].label).to.equal("folder");
            expect(children[1]).to.be.instanceOf(MetadataDiffFileTreeItem);
            expect(children[1].label).to.equal("root-file.txt");
        });

        it("should sort folders alphabetically and files alphabetically at root level", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/z-file.txt",
                    remotePath: "/remote/z-file.txt",
                    relativePath: "z-file.txt",
                    status: "modified"
                },
                {
                    localPath: "/local/a-folder/file.txt",
                    remotePath: "/remote/a-folder/file.txt",
                    relativePath: "a-folder/file.txt",
                    status: "added"
                },
                {
                    localPath: "/local/a-file.txt",
                    remotePath: "/remote/a-file.txt",
                    relativePath: "a-file.txt",
                    status: "modified"
                },
                {
                    localPath: "/local/z-folder/file.txt",
                    remotePath: "/remote/z-folder/file.txt",
                    relativePath: "z-folder/file.txt",
                    status: "deleted"
                },
                {
                    localPath: "/local/m-folder/file.txt",
                    remotePath: "/remote/m-folder/file.txt",
                    relativePath: "m-folder/file.txt",
                    status: "modified"
                },
                {
                    localPath: "/local/m-file.txt",
                    remotePath: "/remote/m-file.txt",
                    relativePath: "m-file.txt",
                    status: "added"
                }
            ];
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

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

        it("should handle backslash path separators", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "C:\\local\\folder\\file.txt",
                    remotePath: "C:\\remote\\folder\\file.txt",
                    relativePath: "folder\\file.txt",
                    status: "modified"
                }
            ];
            const treeItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            const children = treeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(MetadataDiffFolderTreeItem);
            expect(children[0].label).to.equal("folder");
        });
    });
});
