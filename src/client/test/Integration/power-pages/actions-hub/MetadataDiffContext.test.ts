/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import MetadataDiffContext, { MetadataDiffViewMode } from "../../../../power-pages/actions-hub/MetadataDiffContext";
import { IFileComparisonResult } from "../../../../power-pages/actions-hub/models/IFileComparisonResult";

describe("MetadataDiffContext", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Clear the context before each test
        MetadataDiffContext.clear();
        // Reset view mode to default
        MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
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

            MetadataDiffContext.setResults(results, "Test Site");

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

            MetadataDiffContext.setResults(results, "My Test Site");

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

            MetadataDiffContext.setResults(results, "Test Site");

            expect(MetadataDiffContext.isActive).to.be.true;
        });

        it("should set isActive to false when results are empty", () => {
            MetadataDiffContext.setResults([], "Test Site");

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

            MetadataDiffContext.setResults(results, "Test Site");

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
            MetadataDiffContext.setResults(results, "Test Site");

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
            MetadataDiffContext.setResults(results, "Test Site");

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
            MetadataDiffContext.setResults(results, "Test Site");

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

            MetadataDiffContext.setResults(results, "Test Site");

            expect(MetadataDiffContext.comparisonResults).to.have.lengthOf(3);
            expect(MetadataDiffContext.comparisonResults[0].status).to.equal("modified");
            expect(MetadataDiffContext.comparisonResults[1].status).to.equal("added");
            expect(MetadataDiffContext.comparisonResults[2].status).to.equal("deleted");
        });
    });
});
