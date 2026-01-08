/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { openAllMetadataDiffs } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/OpenAllMetadataDiffsHandler";
import { isBinaryFile } from "../../../../../../power-pages/actions-hub/ActionsHubUtils";
import { MetadataDiffSiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import { IFileComparisonResult, ISiteComparisonResults } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { METADATA_DIFF_READONLY_SCHEME } from "../../../../../../power-pages/actions-hub/ReadOnlyContentProvider";

/**
 * Helper function to create ISiteComparisonResults for testing
 */
function createSiteResults(comparisonResults: IFileComparisonResult[], siteName = "Test Site", localSiteName = "Local Test Site", environmentName = "Test Environment"): ISiteComparisonResults {
    return {
        comparisonResults,
        siteName,
        localSiteName,
        environmentName,
        websiteId: "test-website-id",
        environmentId: "test-environment-id"
    };
}

describe("OpenAllMetadataDiffsHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let executeCommandStub: sinon.SinonStub;
    let showInformationMessageStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        executeCommandStub = sandbox.stub(vscode.commands, "executeCommand");
        showInformationMessageStub = sandbox.stub(vscode.window, "showInformationMessage");
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, "sessionId").get(() => "test-session-id");
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("isBinaryFile", () => {
        it("should return true for image files", () => {
            expect(isBinaryFile("test.png")).to.be.true;
            expect(isBinaryFile("test.jpg")).to.be.true;
            expect(isBinaryFile("test.jpeg")).to.be.true;
            expect(isBinaryFile("test.gif")).to.be.true;
            expect(isBinaryFile("test.ico")).to.be.true;
            expect(isBinaryFile("test.webp")).to.be.true;
            expect(isBinaryFile("test.bmp")).to.be.true;
            expect(isBinaryFile("test.svg")).to.be.true;
        });

        it("should return true for font files", () => {
            expect(isBinaryFile("test.woff")).to.be.true;
            expect(isBinaryFile("test.woff2")).to.be.true;
            expect(isBinaryFile("test.ttf")).to.be.true;
            expect(isBinaryFile("test.otf")).to.be.true;
            expect(isBinaryFile("test.eot")).to.be.true;
        });

        it("should return true for media files", () => {
            expect(isBinaryFile("test.mp4")).to.be.true;
            expect(isBinaryFile("test.mp3")).to.be.true;
            expect(isBinaryFile("test.wav")).to.be.true;
        });

        it("should return true for document files", () => {
            expect(isBinaryFile("test.pdf")).to.be.true;
            expect(isBinaryFile("test.doc")).to.be.true;
            expect(isBinaryFile("test.docx")).to.be.true;
        });

        it("should return false for text files", () => {
            expect(isBinaryFile("test.txt")).to.be.false;
            expect(isBinaryFile("test.html")).to.be.false;
            expect(isBinaryFile("test.css")).to.be.false;
            expect(isBinaryFile("test.js")).to.be.false;
            expect(isBinaryFile("test.json")).to.be.false;
            expect(isBinaryFile("test.yml")).to.be.false;
            expect(isBinaryFile("test.yaml")).to.be.false;
        });

        it("should be case insensitive", () => {
            expect(isBinaryFile("test.PNG")).to.be.true;
            expect(isBinaryFile("test.JPG")).to.be.true;
            expect(isBinaryFile("folder/TEST.GIF")).to.be.true;
        });

        it("should handle files with paths", () => {
            expect(isBinaryFile("folder/subfolder/image.png")).to.be.true;
            expect(isBinaryFile("folder\\subfolder\\image.jpg")).to.be.true;
        });
    });

    describe("openAllMetadataDiffs", () => {
        it("should log telemetry event with total files count", async () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
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
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            await openAllMetadataDiffs(siteItem);

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffOpenAll");
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                methodName: "openAllMetadataDiffs",
                totalFiles: "2"
            });
        });

        it("should not execute command when no results", async () => {
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults([]));

            await openAllMetadataDiffs(siteItem);

            expect(executeCommandStub.called).to.be.false;
        });

        it("should execute vscode.changes command with correct parameters for modified files", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            await openAllMetadataDiffs(siteItem);

            expect(executeCommandStub.calledOnce).to.be.true;
            expect(executeCommandStub.firstCall.args[0]).to.equal("vscode.changes");

            const resourceList = executeCommandStub.firstCall.args[2];
            expect(resourceList).to.have.lengthOf(1);

            const [labelUri, originalUri, modifiedUri] = resourceList[0];
            expect(labelUri.toString()).to.include("file.txt");
            expect(originalUri).to.not.be.undefined;
            expect(modifiedUri).to.not.be.undefined;
        });

        it("should set originalUri to undefined for added files", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/added.txt",
                    remotePath: "/remote/added.txt",
                    relativePath: "added.txt",
                    status: "added"
                }
            ];
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            await openAllMetadataDiffs(siteItem);

            const resourceList = executeCommandStub.firstCall.args[2];
            const [, originalUri, modifiedUri] = resourceList[0];
            expect(originalUri).to.be.undefined;
            expect(modifiedUri).to.not.be.undefined;
        });

        it("should set modifiedUri to undefined for deleted files", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/deleted.txt",
                    remotePath: "/remote/deleted.txt",
                    relativePath: "deleted.txt",
                    status: "deleted"
                }
            ];
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            await openAllMetadataDiffs(siteItem);

            const resourceList = executeCommandStub.firstCall.args[2];
            const [, originalUri, modifiedUri] = resourceList[0];
            expect(originalUri).to.not.be.undefined;
            expect(modifiedUri).to.be.undefined;
        });

        it("should handle mixed file statuses correctly", async () => {
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
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            await openAllMetadataDiffs(siteItem);

            const resourceList = executeCommandStub.firstCall.args[2];
            expect(resourceList).to.have.lengthOf(3);

            // Modified file
            expect(resourceList[0][1]).to.not.be.undefined;
            expect(resourceList[0][2]).to.not.be.undefined;

            // Added file
            expect(resourceList[1][1]).to.be.undefined;
            expect(resourceList[1][2]).to.not.be.undefined;

            // Deleted file
            expect(resourceList[2][1]).to.not.be.undefined;
            expect(resourceList[2][2]).to.be.undefined;
        });

        it("should filter out binary files from multi-diff view", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                },
                {
                    localPath: "/local/image.png",
                    remotePath: "/remote/image.png",
                    relativePath: "image.png",
                    status: "modified"
                }
            ];
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            await openAllMetadataDiffs(siteItem);

            // Should only include text file in multi-diff
            const resourceList = executeCommandStub.firstCall.args[2];
            expect(resourceList).to.have.lengthOf(1);
            expect(resourceList[0][0].toString()).to.include("file.txt");

            // Should show info message about binary files
            expect(showInformationMessageStub.calledOnce).to.be.true;
        });

        it("should show message when all files are binary", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/image1.png",
                    remotePath: "/remote/image1.png",
                    relativePath: "image1.png",
                    status: "modified"
                },
                {
                    localPath: "/local/image2.jpg",
                    remotePath: "/remote/image2.jpg",
                    relativePath: "image2.jpg",
                    status: "added"
                }
            ];
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            await openAllMetadataDiffs(siteItem);

            // Should not call vscode.changes when only binary files
            expect(executeCommandStub.called).to.be.false;

            // Should show info message about all files being binary
            expect(showInformationMessageStub.calledOnce).to.be.true;
        });

        it("should log binary file count in telemetry", async () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                },
                {
                    localPath: "/local/image.png",
                    remotePath: "/remote/image.png",
                    relativePath: "image.png",
                    status: "modified"
                }
            ];
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            await openAllMetadataDiffs(siteItem);

            // Should have two telemetry calls: one for total, one for binary stats
            expect(traceInfoStub.calledTwice).to.be.true;
            expect(traceInfoStub.secondCall.args[1]).to.deep.include({
                binaryFilesSkipped: "1",
                textFilesIncluded: "1"
            });
        });

        it("should use read-only scheme for original (remote) URIs", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            await openAllMetadataDiffs(siteItem);

            const resourceList = executeCommandStub.firstCall.args[2];
            const [, originalUri, modifiedUri] = resourceList[0];

            // Original (remote) file should use read-only scheme
            expect(originalUri.scheme).to.equal(METADATA_DIFF_READONLY_SCHEME);
            // Modified (local) file should use regular file scheme
            expect(modifiedUri.scheme).to.equal("file");
        });

        it("should use read-only scheme for deleted files original URI", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/deleted.txt",
                    remotePath: "/remote/deleted.txt",
                    relativePath: "deleted.txt",
                    status: "deleted"
                }
            ];
            const siteItem = new MetadataDiffSiteTreeItem(createSiteResults(results));

            await openAllMetadataDiffs(siteItem);

            const resourceList = executeCommandStub.firstCall.args[2];
            const [, originalUri] = resourceList[0];

            // Deleted file's original (remote) URI should use read-only scheme
            expect(originalUri.scheme).to.equal(METADATA_DIFF_READONLY_SCHEME);
        });
    });
});
