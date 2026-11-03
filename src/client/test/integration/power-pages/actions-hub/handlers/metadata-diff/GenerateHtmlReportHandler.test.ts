/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { runInNewContext } from "vm";
import { expect } from "chai";
import sinon from "sinon";
import { generateHtmlReport, getComponentTypeFromPath, getComponentTypeDisplayName } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/GenerateHtmlReportHandler";
import { MetadataDiffSiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { FileComparisonStatus, IFileComparisonResult, ISiteComparisonResults } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { SiteVisibility } from "../../../../../../power-pages/actions-hub/models/SiteVisibility";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import * as CommonUtils from "../../../../../../../common/utilities/Utils";

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

    async function generateReportHtml(comparisonResults: IFileComparisonResult[]): Promise<string> {
        const testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "metadata-diff-report-"));
        const reportPath = path.join(testDirectory, "report.html");
        showSaveDialogStub.resolves(vscode.Uri.file(reportPath));

        try {
            await generateHtmlReport(createMockTreeItem(comparisonResults));
            return await fs.readFile(reportPath, "utf8");
        } finally {
            await fs.rm(testDirectory, { recursive: true, force: true });
        }
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

        it("should include the extension version in the generated report", async () => {
            sandbox.stub(CommonUtils, "getExtensionVersion").returns("9.8.7");

            const htmlContent = await generateReportHtml([
                { localPath: "/local/file.html", remotePath: "/remote/file.html", relativePath: "file.html", status: FileComparisonStatus.ADDED }
            ]);

            expect(htmlContent).to.include("Extension Version:");
            expect(htmlContent).to.include("9.8.7");
        });
    });

    describe("report accessibility", () => {
        interface IFakeElement {
            readonly style: { display: string };
            readonly classList: {
                add(name: string): void;
                remove(name: string): void;
                contains(name: string): boolean;
            };
            getAttribute(name: string): string | undefined;
            setAttribute(name: string, value: string): void;
        }

        interface IReportPage {
            readonly diffIds: string[];
            header(diffId: string): IFakeElement;
            diff(diffId: string): IFakeElement;
            icon(diffId: string): IFakeElement;
            toggleDiff(diffId: string): void;
            expandAll(): void;
            collapseAll(): void;
        }

        const homePageResult: IFileComparisonResult = {
            localPath: "/local/web-pages/home/home.html",
            remotePath: "/remote/web-pages/home/home.html",
            relativePath: "web-pages/home/home.html",
            status: FileComparisonStatus.MODIFIED
        };

        function createFakeElement(className: string, attributes: Record<string, string> = {}): IFakeElement {
            const classes = new Set([className]);
            const attributeValues = new Map(Object.entries(attributes));
            return {
                style: { display: "none" },
                classList: {
                    add: (name) => { classes.add(name); },
                    remove: (name) => { classes.delete(name); },
                    contains: (name) => classes.has(name)
                },
                getAttribute: (name) => attributeValues.get(name),
                setAttribute: (name, value) => { attributeValues.set(name, value); }
            };
        }

        // Runs the report's inline script against a minimal DOM that mirrors each
        // rendered file row: the header button, its diff container, and its toggle icon.
        function loadReportPage(htmlContent: string): IReportPage {
            const diffIds: string[] = [];
            const headers = new Map<string, IFakeElement>();
            const elementsById = new Map<string, IFakeElement>();
            const headerPattern = /<button type="button" class="file-header" aria-expanded="false" aria-controls="(diff-[^"]+)"/g;
            let headerMatch: RegExpExecArray | null;

            while ((headerMatch = headerPattern.exec(htmlContent)) !== null) {
                const diffId = headerMatch[1];
                diffIds.push(diffId);
                headers.set(diffId, createFakeElement("file-header", { "aria-expanded": "false", "aria-controls": diffId }));
                elementsById.set(diffId, createFakeElement("diff-container"));
                elementsById.set(diffId.replace("diff-", "icon-"), createFakeElement("toggle-icon"));
            }

            const allElements = [...headers.values(), ...elementsById.values()];
            const controlsSelector = /^\[aria-controls="([^"]+)"\]$/;
            const script = /<script>([\s\S]+?)<\/script>/.exec(htmlContent);
            expect(script).not.to.be.null;

            const context: Record<string, unknown> = {
                document: {
                    getElementById: (id: string) => elementsById.get(id) ?? null,
                    querySelector: (selector: string) => {
                        const match = controlsSelector.exec(selector);
                        return match ? headers.get(match[1]) ?? null : null;
                    },
                    querySelectorAll: (selector: string) => selector.startsWith(".")
                        ? allElements.filter(element => element.classList.contains(selector.slice(1)))
                        : []
                }
            };
            runInNewContext(script?.[1] ?? "", context);

            const getRequired = (elements: Map<string, IFakeElement>, id: string): IFakeElement => {
                const element = elements.get(id);
                expect(element, id).to.not.be.undefined;
                return element as IFakeElement;
            };

            return {
                diffIds,
                header: (diffId) => getRequired(headers, diffId),
                diff: (diffId) => getRequired(elementsById, diffId),
                icon: (diffId) => getRequired(elementsById, diffId.replace("diff-", "icon-")),
                toggleDiff: context.toggleDiff as (diffId: string) => void,
                expandAll: context.expandAll as () => void,
                collapseAll: context.collapseAll as () => void
            };
        }

        it("should render each file header as a collapsed button that controls its diff", async () => {
            const htmlContent = await generateReportHtml([homePageResult]);

            expect(htmlContent).to.include(
                `<button type="button" class="file-header" aria-expanded="false" aria-controls="diff-all-0" onclick="toggleDiff('diff-all-0')">`
            );
            expect(htmlContent).to.include(`<div class="diff-container" id="diff-all-0" style="display: none;">`);
            expect(htmlContent).to.include(`<span class="toggle-icon" id="icon-all-0" aria-hidden="true">▶</span>`);
            expect(htmlContent).to.not.include(`<div class="file-header"`);
        });

        it("should show a visible focus indicator on file headers", async () => {
            const htmlContent = await generateReportHtml([homePageResult]);

            expect(htmlContent).to.match(/\.file-header:focus-visible\s*\{\s*outline: 2px solid var\(--primary-color\);\s*outline-offset: -2px;\s*\}/);
        });

        it("should update aria-expanded only on the header whose diff is toggled", async () => {
            const page = loadReportPage(await generateReportHtml([homePageResult]));
            expect(page.diffIds).to.have.length(2);
            const [toggledId, otherId] = page.diffIds;

            page.toggleDiff(toggledId);

            expect(page.header(toggledId).getAttribute("aria-expanded")).to.equal("true");
            expect(page.diff(toggledId).style.display).to.equal("block");
            expect(page.icon(toggledId).classList.contains("expanded")).to.be.true;
            expect(page.header(otherId).getAttribute("aria-expanded")).to.equal("false");
            expect(page.diff(otherId).style.display).to.equal("none");

            page.toggleDiff(toggledId);

            expect(page.header(toggledId).getAttribute("aria-expanded")).to.equal("false");
            expect(page.diff(toggledId).style.display).to.equal("none");
            expect(page.icon(toggledId).classList.contains("expanded")).to.be.false;
        });

        it("should update aria-expanded on every header when expanding or collapsing all", async () => {
            const page = loadReportPage(await generateReportHtml([homePageResult]));
            expect(page.diffIds).to.have.length(2);

            page.expandAll();

            for (const diffId of page.diffIds) {
                expect(page.header(diffId).getAttribute("aria-expanded"), diffId).to.equal("true");
                expect(page.diff(diffId).style.display, diffId).to.equal("block");
            }

            page.collapseAll();

            for (const diffId of page.diffIds) {
                expect(page.header(diffId).getAttribute("aria-expanded"), diffId).to.equal("false");
                expect(page.diff(diffId).style.display, diffId).to.equal("none");
            }
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

        it("should ignore .powerpages-site prefix when determining component type", () => {
            expect(getComponentTypeFromPath(".powerpages-site/web-pages/home/home.html")).to.equal("web-pages");
            expect(getComponentTypeFromPath(".powerpages-site\\content-snippets\\header\\header.html")).to.equal("content-snippets");
        });

        it("should map site-languages folder to the Site Languages tab", () => {
            expect(getComponentTypeFromPath("site-languages/English.websitelanguage.yml")).to.equal("website-languages");
            expect(getComponentTypeFromPath(".powerpages-site/site-languages/English.websitelanguage.yml")).to.equal("website-languages");
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
