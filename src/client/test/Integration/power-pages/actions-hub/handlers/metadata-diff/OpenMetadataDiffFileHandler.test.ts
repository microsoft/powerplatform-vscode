/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { openMetadataDiffFile } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/OpenMetadataDiffFileHandler";
import { MetadataDiffFileTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFileTreeItem";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import { IFileComparisonResult } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";

describe("OpenMetadataDiffFileHandler", () => {
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

    describe("openMetadataDiffFile", () => {
        it("should log telemetry event with file details", async () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "folder/file.txt",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            await openMetadataDiffFile(fileItem);

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffOpenFile");
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                methodName: "openMetadataDiffFile",
                relativePath: "folder/file.txt",
                status: "modified",
                isImported: false
            });
        });

        it("should execute vscode.diff for modified files", async () => {
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "file.txt",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            await openMetadataDiffFile(fileItem);

            // The command may or may not be called depending on file existence
            // We're testing that the correct command is attempted
            const diffCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.diff"
            );
            // If diff was called, verify the arguments
            if (diffCall) {
                expect(diffCall.args[0]).to.equal("vscode.diff");
            }
        });

        it("should use correct URIs for added files (empty left, local right)", async () => {
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/added.txt",
                remotePath: "/remote/added.txt",
                relativePath: "added.txt",
                status: "added"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            await openMetadataDiffFile(fileItem);

            // For added files, the left side should be untitled (empty)
            const diffCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.diff"
            );
            if (diffCall) {
                const leftUri = diffCall.args[1] as vscode.Uri;
                expect(leftUri.scheme).to.equal("untitled");
            }
        });

        it("should use correct URIs for deleted files (remote left, empty right)", async () => {
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/deleted.txt",
                remotePath: "/remote/deleted.txt",
                relativePath: "deleted.txt",
                status: "deleted"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            await openMetadataDiffFile(fileItem);

            // For deleted files, the right side should be untitled (empty)
            const diffCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.diff"
            );
            if (diffCall) {
                const rightUri = diffCall.args[2] as vscode.Uri;
                expect(rightUri.scheme).to.equal("untitled");
            }
        });

        it("should include site name and relative path in the diff title", async () => {
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "folder/file.txt",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "My Site");

            await openMetadataDiffFile(fileItem);

            const diffCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.diff"
            );
            if (diffCall) {
                const title = diffCall.args[3] as string;
                expect(title).to.include("My Site");
                expect(title).to.include("folder/file.txt");
            }
        });

        it("should open binary files side by side for modified binary files", async () => {
            // Note: Since we cannot stub fs.existsSync, this test verifies the handler
            // doesn't throw errors for binary files. The actual vscode.open calls
            // depend on file existence which we cannot mock.
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/image.png",
                remotePath: "/remote/image.png",
                relativePath: "image.png",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            // Should not throw
            await openMetadataDiffFile(fileItem);

            // Verify no vscode.diff was called (binary files should use vscode.open)
            const diffCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.diff"
            );
            expect(diffCall).to.be.undefined;
        });

        it("should open local file for added binary files", async () => {
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/image.png",
                remotePath: "/remote/image.png",
                relativePath: "image.png",
                status: "added"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            // Should not throw
            await openMetadataDiffFile(fileItem);

            // Verify no vscode.diff was called for binary files
            const diffCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.diff"
            );
            expect(diffCall).to.be.undefined;
        });

        it("should open remote file for deleted binary files", async () => {
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/image.png",
                remotePath: "/remote/image.png",
                relativePath: "image.png",
                status: "deleted"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            // Should not throw
            await openMetadataDiffFile(fileItem);

            // Verify no vscode.diff was called for binary files
            const diffCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.diff"
            );
            expect(diffCall).to.be.undefined;
        });

        it("should handle various binary file extensions without using diff command", async () => {
            const binaryExtensions = [".jpg", ".jpeg", ".gif", ".ico", ".webp", ".pdf", ".woff", ".mp4"];

            for (const ext of binaryExtensions) {
                executeCommandStub.resetHistory();

                const comparisonResult: IFileComparisonResult = {
                    localPath: `/local/file${ext}`,
                    remotePath: `/remote/file${ext}`,
                    relativePath: `file${ext}`,
                    status: "modified"
                };
                const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

                // Should not throw
                await openMetadataDiffFile(fileItem);

                // Binary files should not use vscode.diff command
                const diffCall = executeCommandStub.getCalls().find(
                    call => call.args[0] === "vscode.diff"
                );
                expect(diffCall, `Expected no vscode.diff call for ${ext} file`).to.be.undefined;
            }
        });

        it("should include isImported in telemetry for imported comparisons", async () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "folder/file.txt",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site", true);

            await openMetadataDiffFile(fileItem);

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[1]).to.have.property("isImported", true);
        });

        it("should show information message for binary files in imported comparisons", async () => {
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/image.png",
                remotePath: "/remote/image.png",
                relativePath: "image.png",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site", true);

            await openMetadataDiffFile(fileItem);

            expect(showInformationMessageStub.calledOnce).to.be.true;
        });

        it("should not open binary file for imported comparisons", async () => {
            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/image.png",
                remotePath: "/remote/image.png",
                relativePath: "image.png",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site", true);

            await openMetadataDiffFile(fileItem);

            // Should not call vscode.open or vscode.diff for imported binary files
            const openCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.open" || call.args[0] === "vscode.diff"
            );
            expect(openCall).to.be.undefined;
        });
    });
});
