/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import sinon from "sinon";
import { generateHtmlReport, getComponentTypeFromPath, getComponentTypeDisplayName } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/GenerateHtmlReportHandler";
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
                { localPath: "/local/web-pages/home/home.html", remotePath: "/remote/web-pages/home/home.html", relativePath: "web-pages/home/home.html", status: FileComparisonStatus.MODIFIED },
                { localPath: "/local/content-snippets/header/header.html", remotePath: "/remote/content-snippets/header/header.html", relativePath: "content-snippets/header/header.html", status: FileComparisonStatus.ADDED },
                { localPath: "/local/web-files/logo.png", remotePath: "/remote/web-files/logo.png", relativePath: "web-files/logo.png", status: FileComparisonStatus.DELETED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            await generateHtmlReport(treeItem);

            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                fileCount: 3
            });
        });

        it("should include correct file count in telemetry for files grouped by component type", async () => {
            const mockResults: IFileComparisonResult[] = [
                { localPath: "/local/web-pages/home/home.html", remotePath: "/remote/web-pages/home/home.html", relativePath: "web-pages/home/home.html", status: FileComparisonStatus.MODIFIED },
                { localPath: "/local/web-pages/about/about.html", remotePath: "/remote/web-pages/about/about.html", relativePath: "web-pages/about/about.html", status: FileComparisonStatus.MODIFIED },
                { localPath: "/local/content-snippets/header/header.html", remotePath: "/remote/content-snippets/header/header.html", relativePath: "content-snippets/header/header.html", status: FileComparisonStatus.ADDED },
                { localPath: "/local/site-settings/setting.yml", remotePath: "/remote/site-settings/setting.yml", relativePath: "site-settings/setting.yml", status: FileComparisonStatus.DELETED },
                { localPath: "/local/lists/contacts/contacts.yml", remotePath: "/remote/lists/contacts/contacts.yml", relativePath: "lists/contacts/contacts.yml", status: FileComparisonStatus.MODIFIED }
            ];
            const treeItem = createMockTreeItem(mockResults);

            showSaveDialogStub.resolves(undefined);

            await generateHtmlReport(treeItem);

            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                fileCount: 5
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

    describe("getComponentTypeFromPath", () => {
        it("should return web-pages for paths starting with web-pages", () => {
            expect(getComponentTypeFromPath("web-pages/home/home.html")).to.equal("web-pages");
            expect(getComponentTypeFromPath("web-pages/about/about.copy.html")).to.equal("web-pages");
        });

        it("should return content-snippets for paths starting with content-snippets", () => {
            expect(getComponentTypeFromPath("content-snippets/header/header.html")).to.equal("content-snippets");
        });

        it("should return web-files for paths starting with web-files", () => {
            expect(getComponentTypeFromPath("web-files/images/logo.png")).to.equal("web-files");
        });

        it("should return site-settings for paths starting with site-settings", () => {
            expect(getComponentTypeFromPath("site-settings/setting.yml")).to.equal("site-settings");
        });

        it("should return lists for paths starting with lists", () => {
            expect(getComponentTypeFromPath("lists/contacts/contacts.yml")).to.equal("lists");
        });

        it("should return weblink-sets for paths starting with weblink-sets", () => {
            expect(getComponentTypeFromPath("weblink-sets/main-nav/main-nav.yml")).to.equal("weblink-sets");
        });

        it("should return basic-forms for paths starting with basic-forms", () => {
            expect(getComponentTypeFromPath("basic-forms/contact-form/contact-form.yml")).to.equal("basic-forms");
        });

        it("should return advanced-forms for paths starting with advanced-forms", () => {
            expect(getComponentTypeFromPath("advanced-forms/wizard/wizard.yml")).to.equal("advanced-forms");
        });

        it("should return table-permissions for paths starting with table-permissions", () => {
            expect(getComponentTypeFromPath("table-permissions/accounts/accounts.yml")).to.equal("table-permissions");
        });

        it("should return others for unknown folder types", () => {
            expect(getComponentTypeFromPath("unknown-folder/file.html")).to.equal("others");
            expect(getComponentTypeFromPath("file.html")).to.equal("others");
        });

        it("should handle Windows-style path separators", () => {
            expect(getComponentTypeFromPath("web-pages\\home\\home.html")).to.equal("web-pages");
            expect(getComponentTypeFromPath("content-snippets\\header\\header.html")).to.equal("content-snippets");
        });
    });

    describe("getComponentTypeDisplayName", () => {
        it("should return Site Languages for website-languages", () => {
            expect(getComponentTypeDisplayName("website-languages")).to.equal("Site Languages");
        });

        it("should return Web Pages for web-pages", () => {
            expect(getComponentTypeDisplayName("web-pages")).to.equal("Web Pages");
        });

        it("should return Content Snippets for content-snippets", () => {
            expect(getComponentTypeDisplayName("content-snippets")).to.equal("Content Snippets");
        });

        it("should return Web Files for web-files", () => {
            expect(getComponentTypeDisplayName("web-files")).to.equal("Web Files");
        });

        it("should return Site Settings for site-settings", () => {
            expect(getComponentTypeDisplayName("site-settings")).to.equal("Site Settings");
        });

        it("should return Web Links for weblink-sets", () => {
            expect(getComponentTypeDisplayName("weblink-sets")).to.equal("Web Links");
        });

        it("should return Permissions for table-permissions", () => {
            expect(getComponentTypeDisplayName("table-permissions")).to.equal("Permissions");
        });

        it("should return Lists for lists", () => {
            expect(getComponentTypeDisplayName("lists")).to.equal("Lists");
        });

        it("should return Others for others", () => {
            expect(getComponentTypeDisplayName("others")).to.equal("Others");
        });

        it("should return the input for unknown component types", () => {
            expect(getComponentTypeDisplayName("unknown-type")).to.equal("unknown-type");
        });
    });
});
