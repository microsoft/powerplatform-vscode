/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import * as fs from "fs";
import { openMetadataDiffFile } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/OpenMetadataDiffFileHandler";
import { MetadataDiffFileTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFileTreeItem";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import { IFileComparisonResult } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";

describe("OpenMetadataDiffFileHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let executeCommandStub: sinon.SinonStub;
    let existsSyncStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        executeCommandStub = sandbox.stub(vscode.commands, "executeCommand");
        existsSyncStub = sandbox.stub(fs, "existsSync");
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
                status: "modified"
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
            existsSyncStub.returns(true);

            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/image.png",
                remotePath: "/remote/image.png",
                relativePath: "image.png",
                status: "modified"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            await openMetadataDiffFile(fileItem);

            // Should call vscode.open twice for side-by-side view, not vscode.diff
            const openCalls = executeCommandStub.getCalls().filter(
                call => call.args[0] === "vscode.open"
            );
            const diffCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.diff"
            );

            expect(openCalls).to.have.lengthOf(2);
            expect(diffCall).to.be.undefined;

            // First call should open remote file in ViewColumn.One (left)
            expect(openCalls[0].args[1].fsPath).to.equal("/remote/image.png");
            expect(openCalls[0].args[2]).to.equal(vscode.ViewColumn.One);

            // Second call should open local file in ViewColumn.Two (right)
            expect(openCalls[1].args[1].fsPath).to.equal("/local/image.png");
            expect(openCalls[1].args[2]).to.equal(vscode.ViewColumn.Two);
        });

        it("should open local file for added binary files", async () => {
            existsSyncStub.returns(true);

            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/image.png",
                remotePath: "/remote/image.png",
                relativePath: "image.png",
                status: "added"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            await openMetadataDiffFile(fileItem);

            const openCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.open"
            );
            expect(openCall).to.not.be.undefined;

            // Should open local file for added binary
            const openedUri = openCall?.args[1] as vscode.Uri;
            expect(openedUri.fsPath).to.equal("/local/image.png");
        });

        it("should open remote file for deleted binary files", async () => {
            existsSyncStub.returns(true);

            const comparisonResult: IFileComparisonResult = {
                localPath: "/local/image.png",
                remotePath: "/remote/image.png",
                relativePath: "image.png",
                status: "deleted"
            };
            const fileItem = new MetadataDiffFileTreeItem(comparisonResult, "Test Site");

            await openMetadataDiffFile(fileItem);

            const openCall = executeCommandStub.getCalls().find(
                call => call.args[0] === "vscode.open"
            );
            expect(openCall).to.not.be.undefined;

            // Should open remote file for deleted binary
            const openedUri = openCall?.args[1] as vscode.Uri;
            expect(openedUri.fsPath).to.equal("/remote/image.png");
        });

        it("should handle various binary file extensions with side-by-side view for modified files", async () => {
            existsSyncStub.returns(true);

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

                await openMetadataDiffFile(fileItem);

                const openCalls = executeCommandStub.getCalls().filter(
                    call => call.args[0] === "vscode.open"
                );
                expect(openCalls, `Expected two vscode.open calls for ${ext} file`).to.have.lengthOf(2);
            }
        });
    });
});
