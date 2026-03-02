/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as vscode from "vscode";
import {
    resolveSiteFromWorkspace,
    readPowerPagesConfig,
    getFilteredSourceFiles,
    getPowerPagesSiteFiles,
    hasSourceCode,
    compareFiles,
    PowerPagesConfig,
} from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/MetadataDiffUtils";
import { FileComparisonStatus } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import * as WorkspaceInfoFinderUtil from "../../../../../../../common/utilities/WorkspaceInfoFinderUtil";

describe("MetadataDiffUtils", () => {
    let sandbox: sinon.SinonSandbox;
    let tempDir: string;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Create a unique temp directory for each test
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "metadata-diff-test-"));
    });

    afterEach(() => {
        sandbox.restore();
        // Clean up temp directory
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    describe("readPowerPagesConfig", () => {
        it("should return undefined when config file does not exist", () => {
            const result = readPowerPagesConfig(tempDir);
            expect(result).to.be.undefined;
        });

        it("should return undefined for invalid JSON", () => {
            fs.writeFileSync(path.join(tempDir, "powerpages.config.json"), "{ invalid json }");

            const result = readPowerPagesConfig(tempDir);
            expect(result).to.be.undefined;
        });

        it("should parse valid config file", () => {
            const config: PowerPagesConfig = {
                siteName: "Test Site",
                compiledPath: "dist",
                sourceExcludePatterns: ["*.test.ts", "coverage/**"]
            };
            fs.writeFileSync(
                path.join(tempDir, "powerpages.config.json"),
                JSON.stringify(config)
            );

            const result = readPowerPagesConfig(tempDir);

            expect(result).to.not.be.undefined;
            expect(result!.siteName).to.equal("Test Site");
            expect(result!.compiledPath).to.equal("dist");
            expect(result!.sourceExcludePatterns).to.deep.equal(["*.test.ts", "coverage/**"]);
        });

        it("should handle empty config file", () => {
            fs.writeFileSync(path.join(tempDir, "powerpages.config.json"), "{}");

            const result = readPowerPagesConfig(tempDir);

            expect(result).to.not.be.undefined;
            expect(result).to.deep.equal({});
        });
    });

    describe("getFilteredSourceFiles", () => {
        it("should return empty map for non-existent directory", () => {
            const result = getFilteredSourceFiles(path.join(tempDir, "nonexistent"));
            expect(result.size).to.equal(0);
        });

        it("should return all files when no gitignore exists", () => {
            fs.writeFileSync(path.join(tempDir, "file1.ts"), "content1");
            fs.writeFileSync(path.join(tempDir, "file2.js"), "content2");

            const result = getFilteredSourceFiles(tempDir);

            expect(result.size).to.equal(2);
            expect(result.has("file1.ts")).to.be.true;
            expect(result.has("file2.js")).to.be.true;
        });

        it("should filter files based on .gitignore patterns", () => {
            fs.writeFileSync(path.join(tempDir, ".gitignore"), "*.log\ndist/");
            fs.writeFileSync(path.join(tempDir, "app.ts"), "code");
            fs.writeFileSync(path.join(tempDir, "debug.log"), "log content");
            fs.mkdirSync(path.join(tempDir, "dist"));
            fs.writeFileSync(path.join(tempDir, "dist", "bundle.js"), "bundled");

            const result = getFilteredSourceFiles(tempDir);

            expect(result.has("app.ts")).to.be.true;
            expect(result.has("debug.log")).to.be.false;
            expect(result.has("dist/bundle.js")).to.be.false;
        });

        it("should always ignore .git folder", () => {
            fs.mkdirSync(path.join(tempDir, ".git"));
            fs.writeFileSync(path.join(tempDir, ".git", "config"), "git config");
            fs.writeFileSync(path.join(tempDir, "app.ts"), "code");

            const result = getFilteredSourceFiles(tempDir);

            expect(result.has("app.ts")).to.be.true;
            expect(result.has(".git/config")).to.be.false;
        });

        it("should always ignore node_modules folder", () => {
            fs.mkdirSync(path.join(tempDir, "node_modules"));
            fs.writeFileSync(path.join(tempDir, "node_modules", "pkg.js"), "package");
            fs.writeFileSync(path.join(tempDir, "app.ts"), "code");

            const result = getFilteredSourceFiles(tempDir);

            expect(result.has("app.ts")).to.be.true;
            expect(result.has("node_modules/pkg.js")).to.be.false;
        });

        it("should always ignore .powerpages-site folder", () => {
            fs.mkdirSync(path.join(tempDir, ".powerpages-site"));
            fs.writeFileSync(path.join(tempDir, ".powerpages-site", "website.yml"), "site");
            fs.writeFileSync(path.join(tempDir, "app.ts"), "code");

            const result = getFilteredSourceFiles(tempDir);

            expect(result.has("app.ts")).to.be.true;
            expect(result.has(".powerpages-site/website.yml")).to.be.false;
        });

        it("should apply sourceExcludePatterns from config", () => {
            fs.writeFileSync(path.join(tempDir, "app.ts"), "code");
            fs.writeFileSync(path.join(tempDir, "app.test.ts"), "test");
            fs.mkdirSync(path.join(tempDir, "coverage"));
            fs.writeFileSync(path.join(tempDir, "coverage", "report.html"), "report");

            const config: PowerPagesConfig = {
                sourceExcludePatterns: ["*.test.ts", "coverage/**"]
            };

            const result = getFilteredSourceFiles(tempDir, config);

            expect(result.has("app.ts")).to.be.true;
            expect(result.has("app.test.ts")).to.be.false;
            expect(result.has("coverage/report.html")).to.be.false;
        });

        it("should handle negation patterns in gitignore", () => {
            fs.writeFileSync(path.join(tempDir, ".gitignore"), "*.log\n!important.log");
            fs.writeFileSync(path.join(tempDir, "debug.log"), "debug");
            fs.writeFileSync(path.join(tempDir, "important.log"), "important");

            const result = getFilteredSourceFiles(tempDir);

            expect(result.has("debug.log")).to.be.false;
            expect(result.has("important.log")).to.be.true;
        });
    });

    describe("getPowerPagesSiteFiles", () => {
        it("should return empty map when .powerpages-site folder does not exist", () => {
            const result = getPowerPagesSiteFiles(tempDir);
            expect(result.size).to.equal(0);
        });

        it("should return files prefixed with .powerpages-site/", () => {
            const sitePath = path.join(tempDir, ".powerpages-site");
            fs.mkdirSync(sitePath);
            fs.writeFileSync(path.join(sitePath, "website.yml"), "site config");
            fs.mkdirSync(path.join(sitePath, "web-templates"));
            fs.writeFileSync(path.join(sitePath, "web-templates", "header.html"), "<header/>");

            const result = getPowerPagesSiteFiles(tempDir);

            expect(result.size).to.equal(2);
            expect(result.has(".powerpages-site/website.yml")).to.be.true;
            expect(result.has(".powerpages-site/web-templates/header.html")).to.be.true;
        });
    });

    describe("hasSourceCode", () => {
        it("should return false for non-existent directory", () => {
            const result = hasSourceCode(path.join(tempDir, "nonexistent"));
            expect(result).to.be.false;
        });

        it("should return false when only .powerpages-site folder exists", () => {
            fs.mkdirSync(path.join(tempDir, ".powerpages-site"));
            fs.writeFileSync(path.join(tempDir, ".powerpages-site", "website.yml"), "config");

            const result = hasSourceCode(tempDir);
            expect(result).to.be.false;
        });

        it("should return true when non-dot files exist", () => {
            fs.mkdirSync(path.join(tempDir, ".powerpages-site"));
            fs.writeFileSync(path.join(tempDir, "app.ts"), "source code");

            const result = hasSourceCode(tempDir);
            expect(result).to.be.true;
        });

        it("should return true when non-dot folders exist", () => {
            fs.mkdirSync(path.join(tempDir, ".powerpages-site"));
            fs.mkdirSync(path.join(tempDir, "src"));

            const result = hasSourceCode(tempDir);
            expect(result).to.be.true;
        });

        it("should ignore all dot folders", () => {
            fs.mkdirSync(path.join(tempDir, ".git"));
            fs.mkdirSync(path.join(tempDir, ".github"));
            fs.mkdirSync(path.join(tempDir, ".powerpages-site"));

            const result = hasSourceCode(tempDir);
            expect(result).to.be.false;
        });
    });

    describe("compareFiles", () => {
        let remotePath: string;
        let localPath: string;

        beforeEach(() => {
            remotePath = path.join(tempDir, "remote");
            localPath = path.join(tempDir, "local");
            fs.mkdirSync(remotePath);
            fs.mkdirSync(localPath);
        });

        it("should detect modified files", () => {
            fs.writeFileSync(path.join(remotePath, "file.txt"), "remote content");
            fs.writeFileSync(path.join(localPath, "file.txt"), "local content");

            const results = compareFiles(remotePath, localPath);

            expect(results.length).to.equal(1);
            expect(results[0].relativePath).to.equal("file.txt");
            expect(results[0].status).to.equal(FileComparisonStatus.MODIFIED);
        });

        it("should detect deleted files (exists in remote, not in local)", () => {
            fs.writeFileSync(path.join(remotePath, "deleted.txt"), "content");

            const results = compareFiles(remotePath, localPath);

            expect(results.length).to.equal(1);
            expect(results[0].relativePath).to.equal("deleted.txt");
            expect(results[0].status).to.equal(FileComparisonStatus.DELETED);
        });

        it("should detect added files (exists in local, not in remote)", () => {
            fs.writeFileSync(path.join(localPath, "added.txt"), "content");

            const results = compareFiles(remotePath, localPath);

            expect(results.length).to.equal(1);
            expect(results[0].relativePath).to.equal("added.txt");
            expect(results[0].status).to.equal(FileComparisonStatus.ADDED);
        });

        it("should not report identical files", () => {
            fs.writeFileSync(path.join(remotePath, "same.txt"), "identical");
            fs.writeFileSync(path.join(localPath, "same.txt"), "identical");

            const results = compareFiles(remotePath, localPath);

            expect(results.length).to.equal(0);
        });

        it("should use case-insensitive path comparison", () => {
            // Create files with different case - on Windows these would be the same file
            fs.writeFileSync(path.join(remotePath, "File.TXT"), "remote");
            fs.writeFileSync(path.join(localPath, "file.txt"), "local");

            const results = compareFiles(remotePath, localPath);

            // Should be detected as modified (same file, different content)
            // NOT as one deleted and one added
            const addedCount = results.filter(r => r.status === FileComparisonStatus.ADDED).length;
            const deletedCount = results.filter(r => r.status === FileComparisonStatus.DELETED).length;

            // Case-insensitive comparison means we shouldn't see both added AND deleted
            expect(addedCount === 0 || deletedCount === 0).to.be.true;
        });

        describe("code site comparison", () => {
            it("should compare .powerpages-site folders when both are code sites", () => {
                // Setup remote code site
                fs.mkdirSync(path.join(remotePath, ".powerpages-site"));
                fs.writeFileSync(
                    path.join(remotePath, ".powerpages-site", "website.yml"),
                    "remote"
                );

                // Setup local code site
                fs.mkdirSync(path.join(localPath, ".powerpages-site"));
                fs.writeFileSync(
                    path.join(localPath, ".powerpages-site", "website.yml"),
                    "local"
                );

                const results = compareFiles(remotePath, localPath, {
                    isRemoteCodeSite: true,
                    isLocalCodeSite: true,
                    localCodeSiteRootPath: localPath
                });

                expect(results.length).to.equal(1);
                expect(results[0].relativePath).to.equal(".powerpages-site/website.yml");
                expect(results[0].status).to.equal(FileComparisonStatus.MODIFIED);
            });

            it("should compare remote .powerpages-site with entire local when remote is code site and local is not", () => {
                // Setup remote code site
                fs.mkdirSync(path.join(remotePath, ".powerpages-site"));
                fs.writeFileSync(
                    path.join(remotePath, ".powerpages-site", "website.yml"),
                    "config"
                );

                // Setup local non-code site (files at root)
                fs.writeFileSync(path.join(localPath, "website.yml"), "config");

                const results = compareFiles(remotePath, localPath, {
                    isRemoteCodeSite: true,
                    isLocalCodeSite: false
                });

                // Files are identical, so no differences
                expect(results.length).to.equal(0);
            });
        });
    });

    describe("PowerPagesConfig interface", () => {
        it("should match the schema from schemastore.org", () => {
            // This test documents the expected structure of PowerPagesConfig
            // based on https://www.schemastore.org/powerpages.config.json
            const config: PowerPagesConfig = {
                siteName: "Test Site",
                defaultLandingPage: "index.html",
                compiledPath: "dist",
                bundleFilePatterns: ["*.bundle.js"],
                includeSource: true,
                sourceExcludePatterns: ["*.test.ts", "coverage/**"]
            };

            expect(config.siteName).to.equal("Test Site");
            expect(config.defaultLandingPage).to.equal("index.html");
            expect(config.compiledPath).to.equal("dist");
            expect(config.bundleFilePatterns).to.deep.equal(["*.bundle.js"]);
            expect(config.includeSource).to.be.true;
            expect(config.sourceExcludePatterns).to.deep.equal(["*.test.ts", "coverage/**"]);
        });

        it("should allow all properties to be optional", () => {
            const emptyConfig: PowerPagesConfig = {};

            expect(emptyConfig.siteName).to.be.undefined;
            expect(emptyConfig.sourceExcludePatterns).to.be.undefined;
        });
    });

    describe("resolveSiteFromWorkspace", () => {
        let findWebsiteYmlFolderStub: sinon.SinonStub;
        let getWebsiteRecordIdStub: sinon.SinonStub;
        let findPowerPagesSiteFolderStub: sinon.SinonStub;

        beforeEach(() => {
            findWebsiteYmlFolderStub = sandbox.stub(WorkspaceInfoFinderUtil, "findWebsiteYmlFolder");
            getWebsiteRecordIdStub = sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId");
            findPowerPagesSiteFolderStub = sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder");
        });

        it("should return undefined when no site ID is found", () => {
            findWebsiteYmlFolderStub.returns(null);
            getWebsiteRecordIdStub.returns(undefined);
            findPowerPagesSiteFolderStub.returns(null);

            const result = resolveSiteFromWorkspace("/workspace");

            expect(result).to.be.undefined;
        });

        it("should find site ID from working directory (Strategy 2)", () => {
            findWebsiteYmlFolderStub.returns(null);
            getWebsiteRecordIdStub.withArgs("/workspace").returns("site-id-123");
            findPowerPagesSiteFolderStub.returns(null);

            const result = resolveSiteFromWorkspace("/workspace");

            expect(result).to.not.be.undefined;
            expect(result!.siteId).to.equal("site-id-123");
            expect(result!.localSitePath).to.equal("/workspace");
            expect(result!.isLocalCodeSite).to.be.false;
        });

        it("should find site ID from .powerpages-site folder (Strategy 3)", () => {
            findWebsiteYmlFolderStub.returns(null);
            getWebsiteRecordIdStub.withArgs("/workspace").returns(undefined);
            findPowerPagesSiteFolderStub.returns("/workspace");
            getWebsiteRecordIdStub.withArgs(path.join("/workspace", ".powerpages-site")).returns("site-id-456");

            const result = resolveSiteFromWorkspace("/workspace");

            expect(result).to.not.be.undefined;
            expect(result!.siteId).to.equal("site-id-456");
            expect(result!.localSitePath).to.equal(path.join("/workspace", ".powerpages-site"));
            expect(result!.isLocalCodeSite).to.be.true;
            expect(result!.localCodeSiteRootPath).to.equal("/workspace");
        });

        describe("with resource URI (Strategy 1)", () => {
            it("should find site ID from resource path and detect code site", () => {
                const resource = { fsPath: "/workspace/.powerpages-site/web-templates/header.html" } as vscode.Uri;
                findWebsiteYmlFolderStub.withArgs(resource.fsPath).returns("/workspace/.powerpages-site");
                getWebsiteRecordIdStub.withArgs("/workspace/.powerpages-site").returns("site-id-789");

                const result = resolveSiteFromWorkspace("/workspace", resource);

                expect(result).to.not.be.undefined;
                expect(result!.siteId).to.equal("site-id-789");
                expect(result!.localSitePath).to.equal("/workspace/.powerpages-site");
                expect(result!.isLocalCodeSite).to.be.true;
                expect(result!.localCodeSiteRootPath).to.equal("/workspace");
            });

            it("should calculate comparison sub-path from resource", () => {
                const resource = { fsPath: "/workspace/site/web-templates/header.html" } as vscode.Uri;
                findWebsiteYmlFolderStub.withArgs(resource.fsPath).returns("/workspace/site");
                getWebsiteRecordIdStub.withArgs("/workspace/site").returns("site-id-abc");

                const result = resolveSiteFromWorkspace("/workspace", resource);

                expect(result).to.not.be.undefined;
                expect(result!.comparisonSubPath).to.equal(path.join("web-templates", "header.html"));
                expect(result!.isLocalCodeSite).to.be.false;
            });

            it("should not set comparisonSubPath when resource is at site root", () => {
                const resource = { fsPath: "/workspace/site" } as vscode.Uri;
                findWebsiteYmlFolderStub.withArgs(resource.fsPath).returns("/workspace/site");
                getWebsiteRecordIdStub.withArgs("/workspace/site").returns("site-id-def");

                const result = resolveSiteFromWorkspace("/workspace", resource);

                expect(result).to.not.be.undefined;
                expect(result!.comparisonSubPath).to.equal("");
            });
        });

        describe("isLocalCodeSite detection", () => {
            it("should set isLocalCodeSite to true when websiteYmlFolder is inside .powerpages-site", () => {
                const resource = { fsPath: "/project/.powerpages-site/content-snippets" } as vscode.Uri;
                findWebsiteYmlFolderStub.withArgs(resource.fsPath).returns("/project/.powerpages-site");
                getWebsiteRecordIdStub.withArgs("/project/.powerpages-site").returns("code-site-id");

                const result = resolveSiteFromWorkspace("/project", resource);

                expect(result).to.not.be.undefined;
                expect(result!.isLocalCodeSite).to.be.true;
                expect(result!.localCodeSiteRootPath).to.equal("/project");
            });

            it("should set isLocalCodeSite to false when websiteYmlFolder is a regular site", () => {
                const resource = { fsPath: "/project/site/content-snippets" } as vscode.Uri;
                findWebsiteYmlFolderStub.withArgs(resource.fsPath).returns("/project/site");
                getWebsiteRecordIdStub.withArgs("/project/site").returns("regular-site-id");

                const result = resolveSiteFromWorkspace("/project", resource);

                expect(result).to.not.be.undefined;
                expect(result!.isLocalCodeSite).to.be.false;
                expect(result!.localCodeSiteRootPath).to.be.undefined;
            });
        });
    });
});
