/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import { expect } from "chai";
import sinon from "sinon";
import { exportMetadataDiff } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/ExportMetadataDiffHandler";
import { MetadataDiffSiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { FileComparisonStatus, IFileComparisonResult, ISiteComparisonResults } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { SiteVisibility } from "../../../../../../power-pages/actions-hub/models/SiteVisibility";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";

describe("ExportMetadataDiffHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let showSaveDialogStub: sinon.SinonStub;
    let showInformationMessageStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        showSaveDialogStub = sandbox.stub(vscode.window, "showSaveDialog");
        showInformationMessageStub = sandbox.stub(vscode.window, "showInformationMessage");
        // Stub telemetry helpers
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(TelemetryHelper, "traceError");
    });

    afterEach(() => {
        sandbox.restore();
    });

    function createSiteResults(
        comparisonResults: IFileComparisonResult[],
        siteName = "Test Site",
        localSiteName = "Local Test Site",
        environmentName = "Test Environment",
        websiteId = "test-website-id",
        environmentId = "test-environment-id"
    ): ISiteComparisonResults {
        return {
            comparisonResults,
            siteName,
            localSiteName,
            environmentName,
            websiteId,
            environmentId,
            dataModelVersion: 2,
            websiteUrl: "https://test-site.powerappsportals.com",
            siteVisibility: SiteVisibility.Public,
            creator: "test-creator@contoso.com",
            createdOn: "2024-01-15T10:30:00Z"
        };
    }

    function createMockTreeItem(
        comparisonResults: IFileComparisonResult[],
        siteName = "Test Site"
    ): MetadataDiffSiteTreeItem {
        return new MetadataDiffSiteTreeItem(createSiteResults(comparisonResults, siteName));
    }

    describe("exportMetadataDiff", () => {
        it("should prompt user to save file", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined); // User cancelled

            await exportMetadataDiff(treeItem);

            expect(showSaveDialogStub.calledOnce).to.be.true;
            expect(showSaveDialogStub.firstCall.args[0]).to.have.property("filters");
        });

        it("should not show success message when user cancels save dialog", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            await exportMetadataDiff(treeItem);

            expect(showSaveDialogStub.calledOnce).to.be.true;
            expect(showInformationMessageStub.called).to.be.false;
        });

        it("should have JSON filter in save dialog", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            await exportMetadataDiff(treeItem);

            const saveDialogOptions = showSaveDialogStub.firstCall.args[0];
            expect(saveDialogOptions.filters).to.have.property("Site Comparison JSON");
            expect(saveDialogOptions.filters["Site Comparison JSON"]).to.include("json");
        });

        it("should use site name in default file name", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults, "My Test Site");

            showSaveDialogStub.resolves(undefined);

            await exportMetadataDiff(treeItem);

            const saveDialogOptions = showSaveDialogStub.firstCall.args[0];
            expect(saveDialogOptions.defaultUri.fsPath).to.include("My_Test_Site");
        });

        it("should sanitize special characters from site name in default file name", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults, "Site/With:Special*Chars");

            showSaveDialogStub.resolves(undefined);

            await exportMetadataDiff(treeItem);

            const saveDialogOptions = showSaveDialogStub.firstCall.args[0];
            // Special characters should be replaced with underscores
            expect(saveDialogOptions.defaultUri.fsPath).to.include("Site_With_Special_Chars");
        });

        it("should include -diff- in default file name", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            await exportMetadataDiff(treeItem);

            const saveDialogOptions = showSaveDialogStub.firstCall.args[0];
            expect(saveDialogOptions.defaultUri.fsPath).to.include("-diff-");
        });

        it("should include .json extension in default file name", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            await exportMetadataDiff(treeItem);

            const saveDialogOptions = showSaveDialogStub.firstCall.args[0];
            expect(saveDialogOptions.defaultUri.fsPath).to.include(".json");
        });

        it("should log telemetry on export start", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            showSaveDialogStub.resolves(undefined);

            await exportMetadataDiff(treeItem);

            expect(traceInfoStub.called).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffExportCalled");
        });

        it("should include file count in telemetry", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file1.html", remotePath: "/remote/file1.html", relativePath: "file1.html", status: FileComparisonStatus.MODIFIED },
                { localPath: "/local/file2.html", remotePath: "/remote/file2.html", relativePath: "file2.html", status: FileComparisonStatus.ADDED }
            ];
            const treeItem = createMockTreeItem(mockResults);
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            showSaveDialogStub.resolves(undefined);

            await exportMetadataDiff(treeItem);

            expect(traceInfoStub.firstCall.args[1]).to.have.property("fileCount", "2");
        });

        it("should expose localSiteName and siteName properties for export", async () => {
            const siteResults = createSiteResults(
                [],
                "Remote Site Name",
                "Local Site Name",
                "Test Environment",
                "test-website-id",
                "test-environment-id"
            );
            const treeItem = new MetadataDiffSiteTreeItem(siteResults);

            // Verify tree item exposes both local and remote names
            expect(treeItem.siteName).to.equal("Remote Site Name");
            expect(treeItem.localSiteName).to.equal("Local Site Name");
            expect(treeItem.websiteId).to.equal("test-website-id");
        });
    });

    describe("large file handling", () => {
        it("should check file size before reading content", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            // Stub fs methods
            sandbox.stub(fs, "existsSync").returns(true);
            const statSyncStub = sandbox.stub(fs, "statSync").returns({ size: 1024 } as fs.Stats);
            const readFileSyncStub = sandbox.stub(fs, "readFileSync").returns(Buffer.from("test content"));
            sandbox.stub(fs, "writeFileSync");

            showSaveDialogStub.resolves(vscode.Uri.file("/test/export.json"));

            await exportMetadataDiff(treeItem);

            // Verify that statSync was called to check file size
            expect(statSyncStub.called).to.be.true;
            // Verify that file was read (since it's under the size limit)
            expect(readFileSyncStub.called).to.be.true;
        });

        it("should skip reading files larger than 20MB", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/large-file.html", remotePath: "/remote/large-file.html", relativePath: "large-file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            // Stub fs methods - file is 25MB (larger than 20MB limit)
            sandbox.stub(fs, "existsSync").returns(true);
            sandbox.stub(fs, "statSync").returns({ size: 25 * 1024 * 1024 } as fs.Stats);
            const readFileSyncStub = sandbox.stub(fs, "readFileSync").returns(Buffer.from("test content"));
            sandbox.stub(fs, "writeFileSync");

            showSaveDialogStub.resolves(vscode.Uri.file("/test/export.json"));

            await exportMetadataDiff(treeItem);

            // readFileSync should NOT be called because file is too large
            expect(readFileSyncStub.called).to.be.false;
        });

        it("should read files that are exactly at the 20MB limit", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/boundary-file.html", remotePath: "/remote/boundary-file.html", relativePath: "boundary-file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            // Stub fs methods - file is exactly 20MB (at the limit)
            sandbox.stub(fs, "existsSync").returns(true);
            sandbox.stub(fs, "statSync").returns({ size: 20 * 1024 * 1024 } as fs.Stats);
            const readFileSyncStub = sandbox.stub(fs, "readFileSync").returns(Buffer.from("test content"));
            sandbox.stub(fs, "writeFileSync");

            showSaveDialogStub.resolves(vscode.Uri.file("/test/export.json"));

            await exportMetadataDiff(treeItem);

            // readFileSync should be called because file is at or under the limit
            expect(readFileSyncStub.called).to.be.true;
        });

        it("should skip large local file but still read small remote file for MODIFIED status", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/mixed-file.html", remotePath: "/remote/mixed-file.html", relativePath: "mixed-file.html", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            sandbox.stub(fs, "existsSync").returns(true);
            // First call (local file) returns large size, second call (remote file) returns small size
            const statSyncStub = sandbox.stub(fs, "statSync");
            statSyncStub.onFirstCall().returns({ size: 25 * 1024 * 1024 } as fs.Stats); // 25MB local
            statSyncStub.onSecondCall().returns({ size: 1024 } as fs.Stats); // 1KB remote

            const readFileSyncStub = sandbox.stub(fs, "readFileSync").returns(Buffer.from("test content"));
            sandbox.stub(fs, "writeFileSync");

            showSaveDialogStub.resolves(vscode.Uri.file("/test/export.json"));

            await exportMetadataDiff(treeItem);

            // readFileSync should be called once (for the small remote file only)
            expect(readFileSyncStub.callCount).to.equal(1);
        });

        it("should not check file size for binary files", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/image.png", remotePath: "/remote/image.png", relativePath: "image.png", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            sandbox.stub(fs, "existsSync").returns(true);
            const statSyncStub = sandbox.stub(fs, "statSync");
            const readFileSyncStub = sandbox.stub(fs, "readFileSync");
            sandbox.stub(fs, "writeFileSync");

            showSaveDialogStub.resolves(vscode.Uri.file("/test/export.json"));

            await exportMetadataDiff(treeItem);

            // Neither statSync nor readFileSync should be called for binary files
            expect(statSyncStub.called).to.be.false;
            expect(readFileSyncStub.called).to.be.false;
        });

        it("should only check local file size for ADDED status", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/new-file.html", remotePath: "/remote/new-file.html", relativePath: "new-file.html", status: FileComparisonStatus.ADDED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            const existsSyncStub = sandbox.stub(fs, "existsSync");
            existsSyncStub.withArgs("/local/new-file.html").returns(true);
            existsSyncStub.withArgs("/remote/new-file.html").returns(false);

            const statSyncStub = sandbox.stub(fs, "statSync").returns({ size: 1024 } as fs.Stats);
            sandbox.stub(fs, "readFileSync").returns(Buffer.from("test content"));
            sandbox.stub(fs, "writeFileSync");

            showSaveDialogStub.resolves(vscode.Uri.file("/test/export.json"));

            await exportMetadataDiff(treeItem);

            // statSync should only be called once (for local file)
            expect(statSyncStub.callCount).to.equal(1);
        });

        it("should only check remote file size for DELETED status", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/deleted-file.html", remotePath: "/remote/deleted-file.html", relativePath: "deleted-file.html", status: FileComparisonStatus.DELETED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            const existsSyncStub = sandbox.stub(fs, "existsSync");
            existsSyncStub.withArgs("/local/deleted-file.html").returns(false);
            existsSyncStub.withArgs("/remote/deleted-file.html").returns(true);

            const statSyncStub = sandbox.stub(fs, "statSync").returns({ size: 1024 } as fs.Stats);
            sandbox.stub(fs, "readFileSync").returns(Buffer.from("test content"));
            sandbox.stub(fs, "writeFileSync");

            showSaveDialogStub.resolves(vscode.Uri.file("/test/export.json"));

            await exportMetadataDiff(treeItem);

            // statSync should only be called once (for remote file)
            expect(statSyncStub.callCount).to.equal(1);
        });
    });
});
