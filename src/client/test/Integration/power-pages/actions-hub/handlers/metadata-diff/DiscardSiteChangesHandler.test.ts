/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { discardSiteChanges } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/DiscardSiteChangesHandler";
import * as DiscardLocalChangesHandler from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/DiscardLocalChangesHandler";
import MetadataDiffContext from "../../../../../../power-pages/actions-hub/MetadataDiffContext";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import { IFileComparisonResult, FileComparisonStatus } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";
import { MetadataDiffSiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffSiteTreeItem";

describe("DiscardSiteChangesHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let showWarningMessageStub: sinon.SinonStub;
    let showInformationMessageStub: sinon.SinonStub;
    let showErrorMessageStub: sinon.SinonStub;
    let discardSingleFileStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, "sessionId").get(() => "test-session-id");
        showWarningMessageStub = sandbox.stub(vscode.window, "showWarningMessage");
        showInformationMessageStub = sandbox.stub(vscode.window, "showInformationMessage");
        showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");
        discardSingleFileStub = sandbox.stub(DiscardLocalChangesHandler, "discardSingleFile");
    });

    afterEach(() => {
        sandbox.restore();
        MetadataDiffContext.clear();
    });

    function createSiteTreeItem(siteName: string, results?: IFileComparisonResult[]): MetadataDiffSiteTreeItem {
        const defaultResults: IFileComparisonResult[] = results || [
            {
                localPath: "/local/file1.txt",
                remotePath: "/remote/file1.txt",
                relativePath: "file1.txt",
                status: FileComparisonStatus.MODIFIED
            },
            {
                localPath: "/local/file2.txt",
                remotePath: "/remote/file2.txt",
                relativePath: "file2.txt",
                status: FileComparisonStatus.ADDED
            },
            {
                localPath: "/local/file3.txt",
                remotePath: "/remote/file3.txt",
                relativePath: "file3.txt",
                status: FileComparisonStatus.DELETED
            }
        ];

        return new MetadataDiffSiteTreeItem({
            siteName,
            localSiteName: `Local ${siteName}`,
            environmentName: "Test Environment",
            websiteId: "test-website-id",
            environmentId: "test-environment-id",
            comparisonResults: defaultResults
        });
    }

    describe("discardSiteChanges", () => {
        it("should discard all site changes when user confirms", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file1.txt",
                    remotePath: "/remote/file1.txt",
                    relativePath: "file1.txt",
                    status: FileComparisonStatus.MODIFIED
                },
                {
                    localPath: "/local/file2.txt",
                    remotePath: "/remote/file2.txt",
                    relativePath: "file2.txt",
                    status: FileComparisonStatus.ADDED
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");
            const siteItem = createSiteTreeItem("Test Site", results);
            showWarningMessageStub.resolves(Constants.Strings.DISCARD_CHANGES);

            await discardSiteChanges(siteItem);

            expect(discardSingleFileStub.callCount).to.equal(2);
            expect(showInformationMessageStub.calledOnce).to.be.true;
        });

        it("should not discard when user cancels", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: FileComparisonStatus.MODIFIED
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");
            const siteItem = createSiteTreeItem("Test Site", results);
            showWarningMessageStub.resolves(undefined); // User cancelled

            await discardSiteChanges(siteItem);

            expect(discardSingleFileStub.called).to.be.false;
            expect(showInformationMessageStub.called).to.be.false;
        });

        it("should log telemetry event", async () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
            const siteItem = createSiteTreeItem("Test Site");
            showWarningMessageStub.resolves(Constants.Strings.DISCARD_CHANGES);

            await discardSiteChanges(siteItem);

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_DISCARD_SITE);
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                methodName: "discardSiteChanges",
                siteName: "Test Site",
                environmentName: "Test Environment",
                fileCount: 3,
                localSitePath: "/local"
            });
        });

        it("should show confirmation dialog with correct message", async () => {
            const siteItem = createSiteTreeItem("Test Site");
            showWarningMessageStub.resolves(undefined);

            await discardSiteChanges(siteItem);

            expect(showWarningMessageStub.calledOnce).to.be.true;
            expect(showWarningMessageStub.firstCall.args[1]).to.deep.equal({ modal: true });
            expect(showWarningMessageStub.firstCall.args[2]).to.equal(Constants.Strings.DISCARD_CHANGES);
        });

        it("should remove files from context after successful discard", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: FileComparisonStatus.MODIFIED
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");
            const siteItem = createSiteTreeItem("Test Site", results);
            showWarningMessageStub.resolves(Constants.Strings.DISCARD_CHANGES);

            await discardSiteChanges(siteItem);

            expect(MetadataDiffContext.isActive).to.be.false;
        });

        it("should show error message when some files fail to discard", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file1.txt",
                    remotePath: "/remote/file1.txt",
                    relativePath: "file1.txt",
                    status: FileComparisonStatus.MODIFIED
                },
                {
                    localPath: "/local/file2.txt",
                    remotePath: "/remote/file2.txt",
                    relativePath: "file2.txt",
                    status: FileComparisonStatus.MODIFIED
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");
            const siteItem = createSiteTreeItem("Test Site", results);
            showWarningMessageStub.resolves(Constants.Strings.DISCARD_CHANGES);

            // First file succeeds, second file fails
            discardSingleFileStub.onFirstCall().returns(undefined);
            discardSingleFileStub.onSecondCall().throws(new Error("File not found"));

            await discardSiteChanges(siteItem);

            expect(showErrorMessageStub.calledOnce).to.be.true;
            expect(showInformationMessageStub.called).to.be.false;
        });

        it("should show error message when discardSingleFile throws", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: FileComparisonStatus.MODIFIED
                }
            ];
            const siteItem = createSiteTreeItem("Test Site", results);
            showWarningMessageStub.resolves(Constants.Strings.DISCARD_CHANGES);
            discardSingleFileStub.throws(new Error("Test error"));

            await discardSiteChanges(siteItem);

            expect(showErrorMessageStub.calledOnce).to.be.true;
        });

        it("should only remove successfully discarded files from context when some fail", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file1.txt",
                    remotePath: "/remote/file1.txt",
                    relativePath: "file1.txt",
                    status: FileComparisonStatus.MODIFIED
                },
                {
                    localPath: "/local/file2.txt",
                    remotePath: "/remote/file2.txt",
                    relativePath: "file2.txt",
                    status: FileComparisonStatus.MODIFIED
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");
            const siteItem = createSiteTreeItem("Test Site", results);
            showWarningMessageStub.resolves(Constants.Strings.DISCARD_CHANGES);

            // First file succeeds, second file fails
            discardSingleFileStub.onFirstCall().returns(undefined);
            discardSingleFileStub.onSecondCall().throws(new Error("File not found"));

            await discardSiteChanges(siteItem);

            // Context should still be active because one file failed
            expect(MetadataDiffContext.isActive).to.be.true;
            // Only one file should remain (the one that failed)
            expect(MetadataDiffContext.allSiteResults[0].comparisonResults).to.have.lengthOf(1);
            expect(MetadataDiffContext.allSiteResults[0].comparisonResults[0].relativePath).to.equal("file2.txt");
        });
    });
});
