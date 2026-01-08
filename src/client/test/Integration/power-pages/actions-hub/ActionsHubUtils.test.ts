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
import { fetchWebsites, findOtherSites, createKnownSiteIdsSet, getAllFiles, isBinaryFile } from '../../../../power-pages/actions-hub/ActionsHubUtils';
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
