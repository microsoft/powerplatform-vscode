/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fetchWebsites, findOtherSites, createKnownSiteIdsSet, getAllFiles, isBinaryFile, getTopLevelFolder, getEntitiesToInclude, supportsSelectiveDownload, getSupportedFolders } from '../../../../power-pages/actions-hub/ActionsHubUtils';
import { Constants } from '../../../../power-pages/actions-hub/Constants';
import { WebsiteDataModel, ServiceEndpointCategory } from '../../../../../common/services/Constants';
import { IWebsiteDetails, IArtemisAPIOrgResponse } from '../../../../../common/services/Interfaces';
import ArtemisContext from '../../../../ArtemisContext';
import * as WebsiteUtils from '../../../../../common/utilities/WebsiteUtil';
import * as WorkspaceInfoFinderUtil from '../../../../../common/utilities/WorkspaceInfoFinderUtil';
import * as TelemetryHelper from '../../../../power-pages/actions-hub/TelemetryHelper';
import { OrgInfo } from '../../../../pac/PacTypes';

describe('ActionsHubUtils', () => {
    let sandbox: sinon.SinonSandbox;
    let traceErrorStub: sinon.SinonStub;

    const artemisResponse = {
        environment: 'cluster-env',
        clusterCategory: 'cluster-category',
        geoName: 'geo-name'
    } as IArtemisAPIOrgResponse;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(vscode.window, 'showInformationMessage');
        ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.TEST, response: artemisResponse };
        traceErrorStub = sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('fetchWebsites', () => {
        let mockGetActiveWebsites: sinon.SinonStub;
        let mockGetAllWebsites: sinon.SinonStub;

        beforeEach(() => {
            ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.TEST, response: artemisResponse };
            mockGetActiveWebsites = sandbox.stub(WebsiteUtils, 'getActiveWebsites');
            mockGetAllWebsites = sandbox.stub(WebsiteUtils, 'getAllWebsites');
        });

        it('should log the error when there is problem is fetching websites', async () => {
            const activeSites = [
                {
                    name: 'Active Site 1',
                    websiteRecordId: 'active-site-1',
                    dataModel: WebsiteDataModel.Enhanced,
                    websiteUrl: 'https://active-site-1.com',
                    id: 'active-site-1',
                }
            ] as IWebsiteDetails[];

            mockGetActiveWebsites.resolves(activeSites);
            mockGetAllWebsites.rejects(new Error('Test error'));

            const response = await fetchWebsites({} as OrgInfo, true);

            expect(response.activeSites).to.be.empty;
            expect(response.inactiveSites).to.be.empty;

            expect(traceErrorStub.calledOnce).to.be.true;
        });

        it('should return active and inactive websites', async () => {
            const activeSites = [
                {
                    name: 'Active Site 1',
                    websiteRecordId: 'active-site-1',
                    dataModel: WebsiteDataModel.Enhanced,
                    websiteUrl: 'https://active-site-1.com',
                    id: 'active-site-1',
                    siteVisibility: "public",
                    isCodeSite: false
                }
            ] as IWebsiteDetails[];
            const inactiveSites = [
                {
                    name: 'Inactive Site 1',
                    websiteRecordId: 'inactive-site-1',
                    dataModel: WebsiteDataModel.Enhanced,
                    websiteUrl: 'https://inactive-site-1.com',
                    id: 'inactive-site-1',
                    siteVisibility: 'private',
                    siteManagementUrl: "https://inactive-site-1-management.com",
                    isCodeSite: false
                }
            ] as IWebsiteDetails[];

            const allSites = [
                ...activeSites.map(site => ({ ...site, siteManagementUrl: "https://portalmanagement.com", createdOn: "2025-03-20", creator: "Test Creator" })),
                ...inactiveSites

            ] as IWebsiteDetails[];
            mockGetActiveWebsites.resolves(activeSites);
            mockGetAllWebsites.resolves(allSites);

            const response = await fetchWebsites({} as OrgInfo, true);

            expect(response.activeSites).to.deep.equal([...activeSites.map(site => ({ ...site, isCodeSite: false, siteManagementUrl: "https://portalmanagement.com", createdOn: "2025-03-20", creator: "Test Creator" }))]);
            expect(response.inactiveSites).to.deep.equal(inactiveSites);
        });
    });

    describe('findOtherSites', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mockFs: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mockYaml: any;
        let mockWorkspaceFolders: sinon.SinonStub;
        let mockGetWebsiteRecordId: sinon.SinonStub;

        beforeEach(() => {
            // Create mock fs module with stubbed methods
            mockFs = {
                readdirSync: sandbox.stub(),
                existsSync: sandbox.stub(),
                readFileSync: sandbox.stub()
            };

            // Create mock yaml module with stubbed methods
            mockYaml = {
                load: sandbox.stub()
            };

            // Stub workspace folders
            mockWorkspaceFolders = sandbox.stub(vscode.workspace, 'workspaceFolders').get(() => [{
                uri: { fsPath: '/test/current/workspace' },
                name: 'workspace',
                index: 0
            }]);

            // Stub the getWebsiteRecordId function
            mockGetWebsiteRecordId = sandbox.stub(WorkspaceInfoFinderUtil, 'getWebsiteRecordId');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return empty array when no workspace folders exist', () => {
            mockWorkspaceFolders.get(() => undefined);

            const result = findOtherSites(new Set(), mockFs, mockYaml);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should handle filesystem errors', () => {
            const knownSiteIds = new Set<string>();

            mockFs.readdirSync.throws(new Error('Filesystem error'));

            const result = findOtherSites(knownSiteIds, mockFs, mockYaml);

            expect(result).to.be.an('array').that.is.empty;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_FIND_OTHER_SITES_FAILED);
        });

        it('should skip sites with missing website id', () => {
            const knownSiteIds = new Set<string>();

            mockFs.readdirSync.returns([
                { name: 'missing-id-site', isDirectory: () => true }
            ]);

            mockFs.existsSync.returns(true);
            mockFs.readFileSync.returns('yaml content');
            mockYaml.load.returns({
                adx_name: 'Site With Missing ID'
                // No adx_websiteid
            });

            // Setup the stub for getWebsiteRecordId to return null
            mockGetWebsiteRecordId.withArgs('/test/current/workspace/missing-id-site').returns(null);

            const result = findOtherSites(knownSiteIds, mockFs, mockYaml);

            expect(result).to.be.an('array').that.is.empty;
        });
    });

    describe('createKnownSiteIdsSet', () => {
        it('should create a set with active and inactive site IDs', () => {
            const activeSites = [
                { websiteRecordId: 'active-1', name: 'Active Site 1' },
                { websiteRecordId: 'active-2', name: 'Active Site 2' }
            ] as IWebsiteDetails[];

            const inactiveSites = [
                { websiteRecordId: 'inactive-1', name: 'Inactive Site 1' },
                { websiteRecordId: 'inactive-2', name: 'Inactive Site 2' }
            ] as IWebsiteDetails[];

            const result = createKnownSiteIdsSet(activeSites, inactiveSites);

            expect(result.size).to.equal(4);
            expect(result.has('active-1')).to.be.true;
            expect(result.has('active-2')).to.be.true;
            expect(result.has('inactive-1')).to.be.true;
            expect(result.has('inactive-2')).to.be.true;
        });

        it('should handle case sensitivity by converting to lowercase', () => {
            const activeSites = [
                { websiteRecordId: 'ACTIVE-1', name: 'Active Site 1' }
            ] as IWebsiteDetails[];

            const result = createKnownSiteIdsSet(activeSites, undefined);

            expect(result.size).to.equal(1);
            expect(result.has('active-1')).to.be.true;
        });

        it('should handle undefined inputs', () => {
            const result = createKnownSiteIdsSet(undefined, undefined);
            expect(result.size).to.equal(0);
        });

        it('should skip sites with missing websiteRecordId', () => {
            const activeSites = [
                { websiteRecordId: 'active-1', name: 'Active Site 1' },
                { name: 'Site Without ID' } as IWebsiteDetails
            ] as IWebsiteDetails[];

            const result = createKnownSiteIdsSet(activeSites, undefined);

            expect(result.size).to.equal(1);
            expect(result.has('active-1')).to.be.true;
        });
    });

    describe('getAllFiles', () => {
        let tempDir: string;

        beforeEach(() => {
            // Create a temporary directory for each test
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'actions-hub-test-'));
        });

        afterEach(() => {
            // Clean up the temporary directory
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('should return empty map when directory does not exist', () => {
            const result = getAllFiles('/non/existent/path');

            expect(result.size).to.equal(0);
        });

        it('should return empty map for empty directory', () => {
            const result = getAllFiles(tempDir);

            expect(result.size).to.equal(0);
        });

        it('should return files in the directory', () => {
            // Create test files
            fs.writeFileSync(path.join(tempDir, 'file1.txt'), 'content1');
            fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'content2');

            const result = getAllFiles(tempDir);

            expect(result.size).to.equal(2);
            expect(result.has('file1.txt')).to.be.true;
            expect(result.has('file2.txt')).to.be.true;
        });

        it('should return nested files with relative paths', () => {
            // Create nested directory structure
            const subDir = path.join(tempDir, 'subdir');
            fs.mkdirSync(subDir);
            fs.writeFileSync(path.join(subDir, 'nested.txt'), 'content');

            const result = getAllFiles(tempDir);

            expect(result.size).to.equal(1);
            const relativePath = path.join('subdir', 'nested.txt');
            expect(result.has(relativePath)).to.be.true;
        });

        it('should skip directories starting with dot', () => {
            // Create hidden directory
            const hiddenDir = path.join(tempDir, '.hidden');
            fs.mkdirSync(hiddenDir);
            fs.writeFileSync(path.join(hiddenDir, 'hidden.txt'), 'content');

            // Create regular file
            fs.writeFileSync(path.join(tempDir, 'visible.txt'), 'content');

            const result = getAllFiles(tempDir);

            expect(result.size).to.equal(1);
            expect(result.has('visible.txt')).to.be.true;
        });

        it('should skip files starting with dot', () => {
            // Create hidden file
            fs.writeFileSync(path.join(tempDir, '.hidden'), 'content');

            // Create regular file
            fs.writeFileSync(path.join(tempDir, 'visible.txt'), 'content');

            const result = getAllFiles(tempDir);

            expect(result.size).to.equal(1);
            expect(result.has('visible.txt')).to.be.true;
        });

        it('should handle deeply nested directories', () => {
            // Create deep nested structure
            const deepPath = path.join(tempDir, 'level1', 'level2', 'level3');
            fs.mkdirSync(deepPath, { recursive: true });
            fs.writeFileSync(path.join(deepPath, 'deep.txt'), 'content');

            const result = getAllFiles(tempDir);

            expect(result.size).to.equal(1);
            const expectedPath = path.join('level1', 'level2', 'level3', 'deep.txt');
            expect(result.has(expectedPath)).to.be.true;
        });

        it('should return absolute paths as values', () => {
            fs.writeFileSync(path.join(tempDir, 'test.txt'), 'content');

            const result = getAllFiles(tempDir);

            const absolutePath = result.get('test.txt');
            expect(absolutePath).to.equal(path.join(tempDir, 'test.txt'));
        });
    });

    describe('isBinaryFile', () => {
        describe('image files', () => {
            it('should return true for common image formats', () => {
                expect(isBinaryFile("image.png")).to.be.true;
                expect(isBinaryFile("folder/image.png")).to.be.true;
                expect(isBinaryFile("image.jpg")).to.be.true;
                expect(isBinaryFile("image.jpeg")).to.be.true;
                expect(isBinaryFile("animation.gif")).to.be.true;
                expect(isBinaryFile("favicon.ico")).to.be.true;
                expect(isBinaryFile("image.webp")).to.be.true;
                expect(isBinaryFile("bitmap.bmp")).to.be.true;
            });

            it('should treat SVG as binary by default (for diff viewing)', () => {
                expect(isBinaryFile("icon.svg")).to.be.true;
                expect(isBinaryFile("folder/icon.svg")).to.be.true;
            });

            it('should treat SVG as text when includeSvg is false (for export)', () => {
                expect(isBinaryFile("icon.svg", false)).to.be.false;
                expect(isBinaryFile("folder/icon.svg", false)).to.be.false;
            });
        });

        describe('font files', () => {
            it('should return true for font formats', () => {
                expect(isBinaryFile("font.woff")).to.be.true;
                expect(isBinaryFile("font.woff2")).to.be.true;
                expect(isBinaryFile("font.ttf")).to.be.true;
                expect(isBinaryFile("font.otf")).to.be.true;
                expect(isBinaryFile("font.eot")).to.be.true;
            });
        });

        describe('media files', () => {
            it('should return true for media formats', () => {
                expect(isBinaryFile("video.mp4")).to.be.true;
                expect(isBinaryFile("audio.mp3")).to.be.true;
                expect(isBinaryFile("audio.wav")).to.be.true;
                expect(isBinaryFile("audio.ogg")).to.be.true;
            });
        });

        describe('document and archive files', () => {
            it('should return true for document formats', () => {
                expect(isBinaryFile("document.pdf")).to.be.true;
                expect(isBinaryFile("document.doc")).to.be.true;
                expect(isBinaryFile("document.docx")).to.be.true;
            });

            it('should return true for archive formats', () => {
                expect(isBinaryFile("archive.zip")).to.be.true;
                expect(isBinaryFile("archive.rar")).to.be.true;
                expect(isBinaryFile("archive.7z")).to.be.true;
            });
        });

        describe('text files', () => {
            it('should return false for text formats', () => {
                expect(isBinaryFile("page.html")).to.be.false;
                expect(isBinaryFile("styles.css")).to.be.false;
                expect(isBinaryFile("script.js")).to.be.false;
                expect(isBinaryFile("data.json")).to.be.false;
                expect(isBinaryFile("config.xml")).to.be.false;
                expect(isBinaryFile("readme.txt")).to.be.false;
                expect(isBinaryFile("config.yml")).to.be.false;
                expect(isBinaryFile("config.yaml")).to.be.false;
                expect(isBinaryFile("readme.md")).to.be.false;
            });
        });

        describe('case insensitivity', () => {
            it('should handle uppercase extensions', () => {
                expect(isBinaryFile("IMAGE.PNG")).to.be.true;
                expect(isBinaryFile("IMAGE.JPG")).to.be.true;
            });

            it('should handle mixed case extensions', () => {
                expect(isBinaryFile("image.Png")).to.be.true;
                expect(isBinaryFile("folder/IMAGE.JpG")).to.be.true;
            });
        });

        describe('edge cases', () => {
            it('should return false for files without extension', () => {
                expect(isBinaryFile("Makefile")).to.be.false;
                expect(isBinaryFile("README")).to.be.false;
            });

            it('should handle files with multiple dots', () => {
                expect(isBinaryFile("file.backup.png")).to.be.true;
                expect(isBinaryFile("archive.tar.gz")).to.be.true;
            });

            it('should handle paths with dots in folder names', () => {
                expect(isBinaryFile("folder.name/image.png")).to.be.true;
                expect(isBinaryFile(".hidden/file.txt")).to.be.false;
            });

            it('should handle empty string', () => {
                expect(isBinaryFile("")).to.be.false;
            });
        });

        describe('file paths', () => {
            it('should handle Unix-style paths', () => {
                expect(isBinaryFile("folder/subfolder/image.png")).to.be.true;
                expect(isBinaryFile("/absolute/path/image.jpg")).to.be.true;
            });

            it('should handle Windows-style paths', () => {
                expect(isBinaryFile("folder\\subfolder\\image.png")).to.be.true;
                expect(isBinaryFile("C:\\Users\\test\\image.jpg")).to.be.true;
            });
        });
    });
});

/**
 * Folder Entity Mapping tests - in a separate describe block to avoid
 * unnecessary sandbox creation/destruction cycles that can affect other tests.
 * These are pure function tests that don't require mocking.
 */
describe('FolderEntityMapping', () => {
    describe('getTopLevelFolder', () => {
        it('should return undefined for empty string', () => {
            expect(getTopLevelFolder("")).to.be.undefined;
        });

        it('should return the folder name for a simple path', () => {
            expect(getTopLevelFolder("web-pages")).to.equal("web-pages");
        });

        it('should return the first segment for a nested path', () => {
            expect(getTopLevelFolder("web-pages/home")).to.equal("web-pages");
        });

        it('should return the first segment for a deeply nested path', () => {
            expect(getTopLevelFolder("web-pages/home/content-pages/about")).to.equal("web-pages");
        });

        it('should handle Windows-style path separators', () => {
            expect(getTopLevelFolder("web-pages\\home\\content")).to.equal("web-pages");
        });

        it('should handle mixed path separators', () => {
            expect(getTopLevelFolder("web-pages\\home/content")).to.equal("web-pages");
        });
    });

    describe('getEntitiesToInclude', () => {
        describe('Standard (ADX) data model', () => {
            it('should return undefined for empty sub-path', () => {
                expect(getEntitiesToInclude("", 1)).to.be.undefined;
            });

            it('should return undefined for undefined sub-path', () => {
                expect(getEntitiesToInclude(undefined, 1)).to.be.undefined;
            });

            it('should return adx_webpage for web-pages folder', () => {
                const result = getEntitiesToInclude("web-pages", 1);
                expect(result).to.deep.equal(["adx_webpage"]);
            });

            it('should return adx_webpage for nested web-pages path', () => {
                const result = getEntitiesToInclude("web-pages/home/content-pages", 1);
                expect(result).to.deep.equal(["adx_webpage"]);
            });

            it('should return adx_webfile and annotation for web-files folder', () => {
                const result = getEntitiesToInclude("web-files", 1);
                expect(result).to.deep.equal(["adx_webfile", "annotation"]);
            });

            it('should return adx_webtemplate for web-templates folder', () => {
                const result = getEntitiesToInclude("web-templates", 1);
                expect(result).to.deep.equal(["adx_webtemplate"]);
            });

            it('should return adx_contentsnippet for content-snippets folder', () => {
                const result = getEntitiesToInclude("content-snippets", 1);
                expect(result).to.deep.equal(["adx_contentsnippet"]);
            });

            it('should return multiple entities for basic-forms folder', () => {
                const result = getEntitiesToInclude("basic-forms", 1);
                expect(result).to.deep.equal(["adx_entityform", "adx_entityformmetadata"]);
            });

            it('should return multiple entities for advanced-forms folder', () => {
                const result = getEntitiesToInclude("advanced-forms", 1);
                expect(result).to.deep.equal(["adx_webform", "adx_webformstep", "adx_webformmetadata"]);
            });

            it('should return multiple entities for weblink-sets folder', () => {
                const result = getEntitiesToInclude("weblink-sets", 1);
                expect(result).to.deep.equal(["adx_weblinkset", "adx_weblink"]);
            });

            it('should return adx_entitylist for lists folder', () => {
                const result = getEntitiesToInclude("lists", 1);
                expect(result).to.deep.equal(["adx_entitylist"]);
            });

            it('should return adx_sitesetting for site-settings folder', () => {
                const result = getEntitiesToInclude("site-settings", 1);
                expect(result).to.deep.equal(["adx_sitesetting"]);
            });

            it('should return adx_webrole for web-roles folder', () => {
                const result = getEntitiesToInclude("web-roles", 1);
                expect(result).to.deep.equal(["adx_webrole"]);
            });

            it('should return adx_entitypermission for table-permissions folder', () => {
                const result = getEntitiesToInclude("table-permissions", 1);
                expect(result).to.deep.equal(["adx_entitypermission"]);
            });

            it('should return undefined for unknown folder', () => {
                expect(getEntitiesToInclude("unknown-folder", 1)).to.be.undefined;
            });

            it('should be case-insensitive for folder names', () => {
                expect(getEntitiesToInclude("Web-Pages", 1)).to.deep.equal(["adx_webpage"]);
                expect(getEntitiesToInclude("WEB-PAGES", 1)).to.deep.equal(["adx_webpage"]);
            });
        });

        describe('Enhanced (Core) data model', () => {
            it('should return undefined for any folder (not yet supported)', () => {
                expect(getEntitiesToInclude("web-pages", 2)).to.be.undefined;
                expect(getEntitiesToInclude("web-templates", 2)).to.be.undefined;
                expect(getEntitiesToInclude("content-snippets", 2)).to.be.undefined;
            });

            it('should return undefined for empty sub-path', () => {
                expect(getEntitiesToInclude("", 2)).to.be.undefined;
            });
        });
    });

    describe('supportsSelectiveDownload', () => {
        it('should return true for supported folders in Standard model', () => {
            expect(supportsSelectiveDownload("web-pages", 1)).to.be.true;
            expect(supportsSelectiveDownload("web-templates", 1)).to.be.true;
            expect(supportsSelectiveDownload("basic-forms", 1)).to.be.true;
        });

        it('should return false for unsupported folders', () => {
            expect(supportsSelectiveDownload("unknown-folder", 1)).to.be.false;
        });

        it('should return false for empty path', () => {
            expect(supportsSelectiveDownload("", 1)).to.be.false;
            expect(supportsSelectiveDownload(undefined, 1)).to.be.false;
        });

        it('should return false for Enhanced model (not yet supported)', () => {
            expect(supportsSelectiveDownload("web-pages", 2)).to.be.false;
            expect(supportsSelectiveDownload("web-templates", 2)).to.be.false;
        });
    });

    describe('getSupportedFolders', () => {
        it('should return all supported folders for Standard model', () => {
            const folders = getSupportedFolders(1);

            expect(folders).to.be.an("array");
            expect(folders.length).to.be.greaterThan(0);

            // Verify some known folders are included
            expect(folders).to.include("web-pages");
            expect(folders).to.include("web-templates");
            expect(folders).to.include("content-snippets");
            expect(folders).to.include("basic-forms");
            expect(folders).to.include("advanced-forms");
            expect(folders).to.include("weblink-sets");
            expect(folders).to.include("lists");
            expect(folders).to.include("site-settings");
        });

        it('should return empty array for Enhanced model (not yet supported)', () => {
            const folders = getSupportedFolders(2);
            expect(folders).to.be.an("array");
            expect(folders.length).to.equal(0);
        });
    });
});
