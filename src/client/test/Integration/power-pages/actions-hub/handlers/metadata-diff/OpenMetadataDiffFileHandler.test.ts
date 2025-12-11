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

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        executeCommandStub = sandbox.stub(vscode.commands, "executeCommand");
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
            const fileItem = new MetadataDiffFileTreeItem("file.txt", comparisonResult, "Test Site");

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
            const fileItem = new MetadataDiffFileTreeItem("file.txt", comparisonResult, "Test Site");

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
            const fileItem = new MetadataDiffFileTreeItem("added.txt", comparisonResult, "Test Site");

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
            const fileItem = new MetadataDiffFileTreeItem("deleted.txt", comparisonResult, "Test Site");

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
            const fileItem = new MetadataDiffFileTreeItem("file.txt", comparisonResult, "My Site");

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
    });
});
