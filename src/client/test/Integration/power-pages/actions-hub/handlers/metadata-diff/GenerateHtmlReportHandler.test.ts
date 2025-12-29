/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import sinon from "sinon";
import { generateHtmlReport } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/GenerateHtmlReportHandler";
import { MetadataDiffSiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { FileComparisonStatus, IFileComparisonResult, ISiteComparisonResults } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { SiteVisibility } from "../../../../../../power-pages/actions-hub/models/SiteVisibility";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";

describe("GenerateHtmlReportHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let showSaveDialogStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        showSaveDialogStub = sandbox.stub(vscode.window, "showSaveDialog");
        // Stub other methods to prevent actual calls during tests
        sandbox.stub(vscode.window, "showInformationMessage");
        sandbox.stub(vscode.window, "showErrorMessage");
        sandbox.stub(vscode.env, "openExternal");
        // Stub telemetry helpers
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(TelemetryHelper, "traceError");
    });

    afterEach(() => {
        sandbox.restore();
    });

    function createSiteResults(comparisonResults: IFileComparisonResult[], siteName = "Test Site", localSiteName = "Local Test Site", environmentName = "Test Environment"): ISiteComparisonResults {
        return {
            comparisonResults,
            siteName,
            localSiteName,
            environmentName,
            websiteId: "test-website-id",
            environmentId: "test-environment-id",
            dataModelVersion: 2,
            websiteUrl: "https://test-site.powerappsportals.com",
            siteVisibility: SiteVisibility.Public,
            creator: "test-creator@contoso.com",
            createdOn: "2024-01-15T10:30:00Z"
        };
    }

    function createMockTreeItem(comparisonResults: IFileComparisonResult[], siteName = "Test Site", localSiteName = "Local Test Site", environmentName = "Test Environment"): MetadataDiffSiteTreeItem {
        return new MetadataDiffSiteTreeItem(createSiteResults(comparisonResults, siteName, localSiteName, environmentName));
    }

    describe("generateHtmlReport", () => {
        it("should prompt user to save file", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined); // User cancelled

            await generateHtmlReport(treeItem);

            expect(showSaveDialogStub.calledOnce).to.be.true;
            expect(showSaveDialogStub.firstCall.args[0]).to.have.property("filters");
        });

        it("should not show success message when user cancels save dialog", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            // When user cancels, the function should return early without showing success message
            await generateHtmlReport(treeItem);

            // No error should be thrown and the function should complete
            expect(showSaveDialogStub.calledOnce).to.be.true;
        });

        it("should have HTML filter in save dialog", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            await generateHtmlReport(treeItem);

            const saveDialogOptions = showSaveDialogStub.firstCall.args[0];
            expect(saveDialogOptions.filters).to.have.property("HTML Files");
            expect(saveDialogOptions.filters["HTML Files"]).to.include("html");
        });

        it("should use site name in default file name", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults, "My Test Site");

            showSaveDialogStub.resolves(undefined);

            await generateHtmlReport(treeItem);

            const saveDialogOptions = showSaveDialogStub.firstCall.args[0];
            expect(saveDialogOptions.defaultUri.fsPath).to.include("My-Test-Site");
        });

        it("should sanitize special characters from site name in default file name", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults, "Site/With:Special*Chars");

            showSaveDialogStub.resolves(undefined);

            await generateHtmlReport(treeItem);

            const saveDialogOptions = showSaveDialogStub.firstCall.args[0];
            // Special characters should be replaced with hyphens
            expect(saveDialogOptions.defaultUri.fsPath).to.include("Site-With-Special-Chars");
        });

        it("should include metadata-diff-report prefix in default file name", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            await generateHtmlReport(treeItem);

            const saveDialogOptions = showSaveDialogStub.firstCall.args[0];
            expect(saveDialogOptions.defaultUri.fsPath).to.include("metadata-diff-report");
        });
    });

    describe("telemetry", () => {
        it("should call traceInfo when generateHtmlReport is invoked", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults, "Telemetry Test Site");

            showSaveDialogStub.resolves(undefined);

            await generateHtmlReport(treeItem);

            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
            expect(traceInfoStub.called).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffGenerateHtmlReportCalled");
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                siteName: "Telemetry Test Site",
                fileCount: 1
            });
        });

        it("should include correct file count in telemetry for multiple files", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file1.html", remotePath: "/remote/file1.html", relativePath: "file1.html", status: FileComparisonStatus.MODIFIED },
                { localPath: "/local/file2.html", remotePath: "/remote/file2.html", relativePath: "file2.html", status: FileComparisonStatus.ADDED },
                { localPath: "/local/file3.html", remotePath: "/remote/file3.html", relativePath: "file3.html", status: FileComparisonStatus.DELETED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            await generateHtmlReport(treeItem);

            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                fileCount: 3
            });
        });

        it("should not call traceError when user cancels save dialog", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            await generateHtmlReport(treeItem);

            const traceErrorStub = TelemetryHelper.traceError as sinon.SinonStub;
            expect(traceErrorStub.called).to.be.false;
        });
    });
});
