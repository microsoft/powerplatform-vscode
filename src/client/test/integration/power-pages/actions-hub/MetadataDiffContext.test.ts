/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import MetadataDiffContext, { MetadataDiffViewMode, MetadataDiffSortMode } from "../../../../power-pages/actions-hub/MetadataDiffContext";
import { IFileComparisonResult } from "../../../../power-pages/actions-hub/models/IFileComparisonResult";

describe("MetadataDiffContext", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Clear the context before each test
        MetadataDiffContext.clear();
        // Reset view mode to default
        MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
        // Reset sort mode to default
        MetadataDiffContext.setSortMode(MetadataDiffSortMode.Path);
    });

    afterEach(() => {
        sandbox.restore();
        MetadataDiffContext.clear();
    });

    describe("initial state", () => {
        it("should have empty comparison results initially", () => {
            expect(MetadataDiffContext.comparisonResults).to.deep.equal([]);
        });

        it("should have empty site name initially", () => {
            expect(MetadataDiffContext.siteName).to.equal("");
        });

        it("should not be active initially", () => {
            expect(MetadataDiffContext.isActive).to.be.false;
        });
    });

    describe("setResults", () => {
        it("should set comparison results", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];

            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");

            expect(MetadataDiffContext.comparisonResults).to.deep.equal(results);
        });

        it("should set site name", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];

            MetadataDiffContext.setResults(results, "My Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");

            expect(MetadataDiffContext.siteName).to.equal("My Test Site");
        });

        it("should set isActive to true when results are not empty", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];

            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");

            expect(MetadataDiffContext.isActive).to.be.true;
        });

        it("should set isActive to false when results are empty", () => {
            MetadataDiffContext.setResults([], "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");

            expect(MetadataDiffContext.isActive).to.be.false;
        });

        it("should fire onChanged event when results are set", () => {
            const onChangedSpy = sandbox.spy();
            MetadataDiffContext.onChanged(onChangedSpy);

            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "added"
                }
            ];

            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");

            expect(onChangedSpy.calledOnce).to.be.true;
        });
    });

    describe("clear", () => {
        it("should clear comparison results", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");

            MetadataDiffContext.clear();

            expect(MetadataDiffContext.comparisonResults).to.deep.equal([]);
        });

        it("should clear site name", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");

            MetadataDiffContext.clear();

            expect(MetadataDiffContext.siteName).to.equal("");
        });

        it("should set isActive to false", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");

            MetadataDiffContext.clear();

            expect(MetadataDiffContext.isActive).to.be.false;
        });

        it("should fire onChanged event when cleared", () => {
            const onChangedSpy = sandbox.spy();
            MetadataDiffContext.onChanged(onChangedSpy);

            MetadataDiffContext.clear();

            expect(onChangedSpy.calledOnce).to.be.true;
        });
    });

    describe("viewMode", () => {
        it("should default to list view mode", () => {
            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.List);
        });

        it("should allow setting view mode to tree", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.Tree);

            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.Tree);
        });

        it("should allow setting view mode to list", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.Tree);
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);

            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.List);
        });

        it("should return true for isTreeView when in tree mode", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.Tree);

            expect(MetadataDiffContext.isTreeView).to.be.true;
            expect(MetadataDiffContext.isListView).to.be.false;
        });

        it("should return true for isListView when in list mode", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);

            expect(MetadataDiffContext.isListView).to.be.true;
            expect(MetadataDiffContext.isTreeView).to.be.false;
        });

        it("should fire onChanged event when view mode changes", () => {
            const onChangedSpy = sandbox.spy();
            MetadataDiffContext.onChanged(onChangedSpy);

            MetadataDiffContext.setViewMode(MetadataDiffViewMode.Tree);

            expect(onChangedSpy.calledOnce).to.be.true;
        });

        it("should not fire onChanged event when view mode is set to same value", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
            const onChangedSpy = sandbox.spy();
            MetadataDiffContext.onChanged(onChangedSpy);

            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);

            expect(onChangedSpy.called).to.be.false;
        });

        it("should toggle view mode between tree and list", () => {
            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.List);

            MetadataDiffContext.toggleViewMode();
            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.Tree);

            MetadataDiffContext.toggleViewMode();
            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.List);
        });
    });

    describe("initialize", () => {
        it("should load persisted view mode from global state", () => {
            const mockGlobalState = {
                get: sandbox.stub().returns(MetadataDiffViewMode.Tree),
                update: sandbox.stub().resolves()
            };
            const mockContext = {
                globalState: mockGlobalState
            } as unknown as vscode.ExtensionContext;

            MetadataDiffContext.initialize(mockContext);

            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.Tree);
        });

        it("should use default view mode when no persisted value exists", () => {
            const mockGlobalState = {
                get: sandbox.stub().returns(undefined),
                update: sandbox.stub().resolves()
            };
            const mockContext = {
                globalState: mockGlobalState
            } as unknown as vscode.ExtensionContext;

            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List); // Reset to default
            MetadataDiffContext.initialize(mockContext);

            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.List);
        });

        it("should persist view mode when changed after initialization", () => {
            const mockGlobalState = {
                get: sandbox.stub().returns(undefined),
                update: sandbox.stub().resolves()
            };
            const mockContext = {
                globalState: mockGlobalState
            } as unknown as vscode.ExtensionContext;

            MetadataDiffContext.initialize(mockContext);
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.Tree);

            expect(mockGlobalState.update.calledWith(
                "microsoft.powerplatform.pages.metadataDiff.viewModePreference",
                MetadataDiffViewMode.Tree
            )).to.be.true;
        });
    });

    describe("sortMode", () => {
        it("should default to path sort mode", () => {
            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Path);
        });

        it("should allow setting sort mode to name", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Name);

            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Name);
        });

        it("should allow setting sort mode to status", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Status);

            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Status);
        });

        it("should allow setting sort mode to path", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Name);
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Path);

            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Path);
        });

        it("should fire onChanged event when sort mode changes", () => {
            const onChangedSpy = sandbox.spy();
            MetadataDiffContext.onChanged(onChangedSpy);

            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Name);

            expect(onChangedSpy.calledOnce).to.be.true;
        });

        it("should not fire onChanged event when sort mode is set to same value", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Path);
            const onChangedSpy = sandbox.spy();
            MetadataDiffContext.onChanged(onChangedSpy);

            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Path);

            expect(onChangedSpy.called).to.be.false;
        });

        it("should load persisted sort mode from global state", () => {
            const mockGlobalState = {
                get: sandbox.stub().callsFake((key: string) => {
                    if (key === "microsoft.powerplatform.pages.metadataDiff.sortModePreference") {
                        return MetadataDiffSortMode.Status;
                    }
                    return undefined;
                }),
                update: sandbox.stub().resolves()
            };
            const mockContext = {
                globalState: mockGlobalState
            } as unknown as vscode.ExtensionContext;

            MetadataDiffContext.initialize(mockContext);

            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Status);
        });

        it("should persist sort mode when changed after initialization", () => {
            const mockGlobalState = {
                get: sandbox.stub().returns(undefined),
                update: sandbox.stub().resolves()
            };
            const mockContext = {
                globalState: mockGlobalState
            } as unknown as vscode.ExtensionContext;

            MetadataDiffContext.initialize(mockContext);
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Name);

            expect(mockGlobalState.update.calledWith(
                "microsoft.powerplatform.pages.metadataDiff.sortModePreference",
                MetadataDiffSortMode.Name
            )).to.be.true;
        });
    });

    describe("multiple file comparison results", () => {
        it("should handle modified, added, and deleted files", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/modified.txt",
                    remotePath: "/remote/modified.txt",
                    relativePath: "modified.txt",
                    status: "modified"
                },
                {
                    localPath: "/local/added.txt",
                    remotePath: "/remote/added.txt",
                    relativePath: "added.txt",
                    status: "added"
                },
                {
                    localPath: "/local/deleted.txt",
                    remotePath: "/remote/deleted.txt",
                    relativePath: "deleted.txt",
                    status: "deleted"
                }
            ];

            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");

            expect(MetadataDiffContext.comparisonResults).to.have.lengthOf(3);
            expect(MetadataDiffContext.comparisonResults[0].status).to.equal("modified");
            expect(MetadataDiffContext.comparisonResults[1].status).to.equal("added");
            expect(MetadataDiffContext.comparisonResults[2].status).to.equal("deleted");
        });
    });

    describe("getUniqueKey", () => {
        it("should generate key for live comparison", () => {
            const key = MetadataDiffContext.getUniqueKey("website-123", "env-456", false);
            expect(key).to.equal("website-123_env-456");
        });

        it("should generate key with _imported suffix for imported comparison", () => {
            const key = MetadataDiffContext.getUniqueKey("website-123", "env-456", true);
            expect(key).to.equal("website-123_env-456_imported");
        });

        it("should default isImported to false", () => {
            const key = MetadataDiffContext.getUniqueKey("website-123", "env-456");
            expect(key).to.equal("website-123_env-456");
        });
    });

    describe("hasImportedComparison", () => {
        it("should return false when no imported comparison exists", () => {
            expect(MetadataDiffContext.hasImportedComparison("website-123", "env-456")).to.be.false;
        });

        it("should return true when imported comparison exists", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456", true, "2024-01-15T10:30:00Z");

            expect(MetadataDiffContext.hasImportedComparison("website-123", "env-456")).to.be.true;
        });

        it("should return false when only live comparison exists", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456", false);

            expect(MetadataDiffContext.hasImportedComparison("website-123", "env-456")).to.be.false;
        });
    });

    describe("clearSiteByKey", () => {
        it("should clear live comparison by key", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456", false);

            expect(MetadataDiffContext.isActive).to.be.true;

            MetadataDiffContext.clearSiteByKey("website-123", "env-456", false);

            expect(MetadataDiffContext.isActive).to.be.false;
        });

        it("should clear imported comparison by key", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456", true, "2024-01-15T10:30:00Z");

            expect(MetadataDiffContext.hasImportedComparison("website-123", "env-456")).to.be.true;

            MetadataDiffContext.clearSiteByKey("website-123", "env-456", true);

            expect(MetadataDiffContext.hasImportedComparison("website-123", "env-456")).to.be.false;
        });

        it("should only clear specified comparison type", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            // Add both live and imported comparisons
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456", false);
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456", true, "2024-01-15T10:30:00Z");

            expect(MetadataDiffContext.allSiteResults).to.have.lengthOf(2);

            // Clear only the imported one
            MetadataDiffContext.clearSiteByKey("website-123", "env-456", true);

            expect(MetadataDiffContext.allSiteResults).to.have.lengthOf(1);
            expect(MetadataDiffContext.hasImportedComparison("website-123", "env-456")).to.be.false;
            expect(MetadataDiffContext.isActive).to.be.true;
        });

        it("should fire onChanged event when clearing", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456", false);

            const onChangedSpy = sandbox.spy();
            MetadataDiffContext.onChanged(onChangedSpy);

            MetadataDiffContext.clearSiteByKey("website-123", "env-456", false);

            expect(onChangedSpy.calledOnce).to.be.true;
        });
    });

    describe("imported comparisons", () => {
        it("should store imported comparison with exportedAt timestamp", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            const exportedAt = "2024-01-15T10:30:00Z";
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456", true, exportedAt);

            const siteResults = MetadataDiffContext.allSiteResults;
            expect(siteResults).to.have.lengthOf(1);
            expect(siteResults[0].isImported).to.be.true;
            expect(siteResults[0].exportedAt).to.equal(exportedAt);
        });

        it("should allow both live and imported comparisons for same site", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456", false);
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456", true, "2024-01-15T10:30:00Z");

            expect(MetadataDiffContext.allSiteResults).to.have.lengthOf(2);
        });
    });

    describe("removeFile", () => {
        it("should remove a single file from comparison results", () => {
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
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456");

            MetadataDiffContext.removeFile("file1.txt", "Test Site");

            expect(MetadataDiffContext.allSiteResults[0].comparisonResults).to.have.lengthOf(1);
            expect(MetadataDiffContext.allSiteResults[0].comparisonResults[0].relativePath).to.equal("file2.txt");
        });

        it("should remove site when last file is removed", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456");

            MetadataDiffContext.removeFile("file.txt", "Test Site");

            expect(MetadataDiffContext.isActive).to.be.false;
        });

        it("should fire onChanged event when file is removed", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456");

            const onChangedSpy = sandbox.spy();
            MetadataDiffContext.onChanged(onChangedSpy);

            MetadataDiffContext.removeFile("file.txt", "Test Site");

            expect(onChangedSpy.calledOnce).to.be.true;
        });
    });

    describe("removeFiles", () => {
        it("should remove multiple files from comparison results in a single operation", () => {
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
                },
                {
                    localPath: "/local/file3.txt",
                    remotePath: "/remote/file3.txt",
                    relativePath: "file3.txt",
                    status: "deleted"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456");

            MetadataDiffContext.removeFiles(new Set(["file1.txt", "file3.txt"]), "Test Site");

            expect(MetadataDiffContext.allSiteResults[0].comparisonResults).to.have.lengthOf(1);
            expect(MetadataDiffContext.allSiteResults[0].comparisonResults[0].relativePath).to.equal("file2.txt");
        });

        it("should remove site when all files are removed", () => {
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
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456");

            MetadataDiffContext.removeFiles(new Set(["file1.txt", "file2.txt"]), "Test Site");

            expect(MetadataDiffContext.isActive).to.be.false;
        });

        it("should fire onChanged event only once when removing multiple files", () => {
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
                },
                {
                    localPath: "/local/file3.txt",
                    remotePath: "/remote/file3.txt",
                    relativePath: "file3.txt",
                    status: "deleted"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456");

            const onChangedSpy = sandbox.spy();
            MetadataDiffContext.onChanged(onChangedSpy);

            MetadataDiffContext.removeFiles(new Set(["file1.txt", "file2.txt", "file3.txt"]), "Test Site");

            expect(onChangedSpy.calledOnce).to.be.true;
        });

        it("should not fire onChanged event when removing empty set", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456");

            const onChangedSpy = sandbox.spy();
            MetadataDiffContext.onChanged(onChangedSpy);

            MetadataDiffContext.removeFiles(new Set(), "Test Site");

            expect(onChangedSpy.called).to.be.false;
        });

        it("should handle non-existent files gracefully", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "website-123", "env-456");

            MetadataDiffContext.removeFiles(new Set(["nonexistent.txt"]), "Test Site");

            expect(MetadataDiffContext.allSiteResults[0].comparisonResults).to.have.lengthOf(1);
        });
    });
});
