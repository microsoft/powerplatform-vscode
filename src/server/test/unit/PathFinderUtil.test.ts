/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { pathToFileURL } from 'url';
import { searchPortalConfigFolder, getPortalConfigFolderUrl } from '../../../common/utilities/PathFinderUtil';

describe('PathFinderUtil', () => {
    let tempDir: string;
    let portalConfigDir: string;
    let webPagesDir: string;
    let homeDir: string;

    before(() => {
        // Create a temporary directory structure for testing
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pathfinderutil-test-'));
        portalConfigDir = path.join(tempDir, '.portalconfig');
        webPagesDir = path.join(tempDir, 'web-pages');
        homeDir = path.join(webPagesDir, 'home');

        fs.mkdirSync(portalConfigDir);
        fs.mkdirSync(webPagesDir);
        fs.mkdirSync(homeDir);
        fs.writeFileSync(path.join(homeDir, 'Home.webpage.yml'), 'test content');
        fs.writeFileSync(path.join(portalConfigDir, 'test-manifest.yml'), 'test manifest');
    });

    after(() => {
        // Clean up the temporary directory
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    describe('searchPortalConfigFolder', () => {
        it('should return null when rootFolder is null', () => {
            const result = searchPortalConfigFolder(null, pathToFileURL(path.join(homeDir, 'Home.webpage.yml')).href);
            expect(result).to.be.null;
        });

        it('should return null when file does not start with rootFolder', () => {
            const result = searchPortalConfigFolder(
                pathToFileURL('/some/other/path').href,
                pathToFileURL(path.join(homeDir, 'Home.webpage.yml')).href
            );
            expect(result).to.be.null;
        });

        it('should return null when file equals rootFolder', () => {
            const result = searchPortalConfigFolder(
                pathToFileURL(tempDir).href,
                pathToFileURL(tempDir).href
            );
            expect(result).to.be.null;
        });

        it('should handle file:// URI format correctly and find .portalconfig', () => {
            const rootFolder = pathToFileURL(tempDir).href;
            const file = pathToFileURL(path.join(homeDir, 'Home.webpage.yml')).href;

            const result = searchPortalConfigFolder(rootFolder, file);

            expect(result).to.not.be.null;
            expect(result?.href).to.include('.portalconfig');
        });

        it('should handle plain paths without file:// prefix', () => {
            // This is the key test for the bug fix - paths without file:// prefix
            const rootFolder = tempDir;
            const file = path.join(homeDir, 'Home.webpage.yml');

            const result = searchPortalConfigFolder(rootFolder, file);

            expect(result).to.not.be.null;
            expect(result?.href).to.include('.portalconfig');
        });

        it('should handle mixed formats (rootFolder with file://, file without)', () => {
            // This tests the normalization - rootFolder has file:// but file doesn't
            const rootFolder = pathToFileURL(tempDir).href;
            const file = path.join(homeDir, 'Home.webpage.yml');

            const result = searchPortalConfigFolder(rootFolder, file);

            expect(result).to.not.be.null;
            expect(result?.href).to.include('.portalconfig');
        });

        it('should handle mixed formats (rootFolder without file://, file with)', () => {
            // This tests the normalization - rootFolder doesn't have file:// but file does
            const rootFolder = tempDir;
            const file = pathToFileURL(path.join(homeDir, 'Home.webpage.yml')).href;

            const result = searchPortalConfigFolder(rootFolder, file);

            expect(result).to.not.be.null;
            expect(result?.href).to.include('.portalconfig');
        });
    });

    describe('getPortalConfigFolderUrl', () => {
        it('should return null when workspaceRootFolders is null', () => {
            const result = getPortalConfigFolderUrl(null, pathToFileURL(path.join(homeDir, 'Home.webpage.yml')).href);
            expect(result).to.be.null;
        });

        it('should return null when workspaceRootFolders is empty', () => {
            const result = getPortalConfigFolderUrl([], pathToFileURL(path.join(homeDir, 'Home.webpage.yml')).href);
            expect(result).to.be.null;
        });

        it('should search through workspace folders and find .portalconfig with file:// URIs', () => {
            const workspaceRootFolders = [
                { uri: pathToFileURL(tempDir).href, name: 'project' }
            ];
            const file = pathToFileURL(path.join(homeDir, 'Home.webpage.yml')).href;

            const result = getPortalConfigFolderUrl(workspaceRootFolders, file);

            expect(result).to.not.be.null;
            expect(result?.href).to.include('.portalconfig');
        });

        it('should search through workspace folders and find .portalconfig with plain paths', () => {
            // Test with plain paths (no file:// prefix) - this tests the fix
            const workspaceRootFolders = [
                { uri: tempDir, name: 'project' }
            ];
            const file = path.join(homeDir, 'Home.webpage.yml');

            const result = getPortalConfigFolderUrl(workspaceRootFolders, file);

            expect(result).to.not.be.null;
            expect(result?.href).to.include('.portalconfig');
        });
    });
});
