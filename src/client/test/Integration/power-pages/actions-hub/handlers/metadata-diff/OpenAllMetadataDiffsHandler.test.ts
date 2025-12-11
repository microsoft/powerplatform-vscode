/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { openAllMetadataDiffs } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/OpenAllMetadataDiffsHandler";
import { MetadataDiffGroupTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffGroupTreeItem";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import { IFileComparisonResult } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";

describe("OpenAllMetadataDiffsHandler", () => {
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
            const groupItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            await openAllMetadataDiffs(groupItem);

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffOpenAll");
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                methodName: "openAllMetadataDiffs",
                totalFiles: "2"
            });
        });

        it("should not execute command when no results", async () => {
            const groupItem = new MetadataDiffGroupTreeItem([], "Test Site");

            await openAllMetadataDiffs(groupItem);

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
            const groupItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            await openAllMetadataDiffs(groupItem);

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
            const groupItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            await openAllMetadataDiffs(groupItem);

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
            const groupItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            await openAllMetadataDiffs(groupItem);

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
            const groupItem = new MetadataDiffGroupTreeItem(results, "Test Site");

            await openAllMetadataDiffs(groupItem);

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
    });
});
