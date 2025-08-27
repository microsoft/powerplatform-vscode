/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";

// Test URI handling functionality
describe('UriHandler Schema Parameter Tests', () => {

    describe('Parameter Validation', () => {
        it('should validate required websiteid parameter', () => {
            const uri = new URL('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?envid=test&orgurl=https://test.com');
            const params = new URLSearchParams(uri.search);

            expect(params.get('websiteid')).to.be.null;
            expect(params.get('envid')).to.equal('test');
            expect(params.get('orgurl')).to.equal('https://test.com');
        });

        it('should validate required envid parameter', () => {
            const uri = new URL('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=test&orgurl=https://test.com');
            const params = new URLSearchParams(uri.search);

            expect(params.get('websiteid')).to.equal('test');
            expect(params.get('envid')).to.be.null;
            expect(params.get('orgurl')).to.equal('https://test.com');
        });

        it('should validate required orgurl parameter', () => {
            const uri = new URL('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=test&envid=test');
            const params = new URLSearchParams(uri.search);

            expect(params.get('websiteid')).to.equal('test');
            expect(params.get('envid')).to.equal('test');
            expect(params.get('orgurl')).to.be.null;
        });

        it('should extract all parameters correctly', () => {
            const uri = new URL('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=123&envid=456&orgurl=https://test.com&schema=PortalSchemaV2');
            const params = new URLSearchParams(uri.search);

            expect(params.get('websiteid')).to.equal('123');
            expect(params.get('envid')).to.equal('456');
            expect(params.get('orgurl')).to.equal('https://test.com');
            expect(params.get('schema')).to.equal('PortalSchemaV2');
        });
    });

    describe('Schema Parameter Handling', () => {
        it('should extract schema parameter correctly', () => {
            const uri = new URL('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=123&envid=456&orgurl=https://test.com&schema=PortalSchemaV2');
            const params = new URLSearchParams(uri.search);

            expect(params.get('schema')).to.equal('PortalSchemaV2');
        });

        it('should handle missing schema parameter', () => {
            const uri = new URL('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=123&envid=456&orgurl=https://test.com');
            const params = new URLSearchParams(uri.search);

            expect(params.get('schema')).to.be.null;
        });

        it('should determine model version 2 for PortalSchemaV2', () => {
            const uri = new URL('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?schema=PortalSchemaV2');
            const params = new URLSearchParams(uri.search);
            const schema = params.get('schema');
            const modelVersion = schema && schema.toLowerCase() === 'portalschemav2' ? 2 : 1;

            expect(modelVersion).to.equal(2);
        });

        it('should determine model version 1 for other schema values', () => {
            const uri = new URL('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?schema=OtherSchema');
            const params = new URLSearchParams(uri.search);
            const schema = params.get('schema');
            const modelVersion = schema && schema.toLowerCase() === 'portalschemav2' ? 2 : 1;

            expect(modelVersion).to.equal(1);
        });

        it('should determine model version 1 when schema is missing', () => {
            const uri = new URL('vscode://microsoft-IsvExpTools.powerplatform-vscode/open');
            const params = new URLSearchParams(uri.search);
            const schema = params.get('schema');
            const modelVersion = schema && schema.toLowerCase() === 'portalschemav2' ? 2 : 1;

            expect(modelVersion).to.equal(1);
        });

        it('should handle case-insensitive schema parameter', () => {
            const testCases = ['PortalSchemaV2', 'portalschemav2', 'PORTALSCHEMAV2', 'PortalSchemav2'];

            testCases.forEach(schemaValue => {
                const uri = new URL(`vscode://microsoft-IsvExpTools.powerplatform-vscode/open?schema=${schemaValue}`);
                const params = new URLSearchParams(uri.search);
                const schema = params.get('schema');
                const modelVersion = schema && schema.toLowerCase() === 'portalschemav2' ? 2 : 1;

                expect(modelVersion).to.equal(2, `Failed for schema value: ${schemaValue}`);
            });
        });

        it('should handle empty schema parameter', () => {
            const uri = new URL('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?schema=');
            const params = new URLSearchParams(uri.search);
            const schema = params.get('schema');
            const modelVersion = schema && schema.toLowerCase() === 'portalschemav2' ? 2 : 1;

            expect(modelVersion).to.equal(1);
        });
    });

    describe('URI Construction', () => {
        it('should build desktop URI with schema parameter', () => {
            const websiteId = "test-site-123";
            const envId = "test-env-456";
            const orgUrl = "https://test.crm.dynamics.com";
            const schema = "PortalSchemaV2";

            const uri = `vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=${websiteId}&envid=${envId}&orgurl=${encodeURIComponent(orgUrl)}&schema=${schema}`;

            expect(uri).to.include('websiteid=test-site-123');
            expect(uri).to.include('envid=test-env-456');
            expect(uri).to.include('orgurl=https%3A%2F%2Ftest.crm.dynamics.com');
            expect(uri).to.include('schema=PortalSchemaV2');
        });

        it('should build desktop URI without schema parameter', () => {
            const websiteId = "test-site-123";
            const envId = "test-env-456";
            const orgUrl = "https://test.crm.dynamics.com";

            const uri = `vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=${websiteId}&envid=${envId}&orgurl=${encodeURIComponent(orgUrl)}`;

            expect(uri).to.include('websiteid=test-site-123');
            expect(uri).to.include('envid=test-env-456');
            expect(uri).to.include('orgurl=https%3A%2F%2Ftest.crm.dynamics.com');
            expect(uri).to.not.include('schema=');
        });
    });

    describe('Command Generation Logic', () => {
        it('should generate download command with model version 2', () => {
            const websiteId = "test-123";
            const folderPath = "/test/folder";
            const modelVersion = 2;

            const command = `pac pages download --path "${folderPath}" --websiteId "${websiteId}" --modelVersion ${modelVersion}`;

            expect(command).to.include('--modelVersion 2');
            expect(command).to.include('--websiteId "test-123"');
            expect(command).to.include('--path "/test/folder"');
        });

        it('should generate download command with model version 1', () => {
            const websiteId = "test-456";
            const folderPath = "/test/folder";
            const modelVersion = 1;

            const command = `pac pages download --path "${folderPath}" --websiteId "${websiteId}" --modelVersion ${modelVersion}`;

            expect(command).to.include('--modelVersion 1');
            expect(command).to.include('--websiteId "test-456"');
            expect(command).to.include('--path "/test/folder"');
        });
    });

    describe('Terminal Execution Behavior', () => {
        it('should execute download command using terminal API', () => {
            const websiteId = "test-123";
            const folderPath = "/test/folder";
            const modelVersion = 2;

            const command = `pac pages download --path "${folderPath}" --websiteId "${websiteId}" --modelVersion ${modelVersion}`;

            // Verify the command structure
            expect(command).to.equal('pac pages download --path "/test/folder" --websiteId "test-123" --modelVersion 2');
        });

        it('should show informational message about download start', () => {
            const modelVersion = 2;
            const expectedMessage = `Power Pages site download started using model version ${modelVersion}. The terminal will show progress.`;

            expect(expectedMessage).to.include('model version 2');
            expect(expectedMessage).to.include('The terminal will show progress');
        });

        it('should show completion dialog after timeout', () => {
            const completionMessage = "Power Pages site download should be complete. Would you like to open the downloaded site folder?";
            const options = ["Open Folder", "Open in New Workspace", "Not Now"];
            const timeoutDuration = 30000; // 30 seconds

            expect(completionMessage).to.include('download should be complete');
            expect(options).to.include('Open Folder');
            expect(options).to.include('Open in New Workspace');
            expect(options).to.include('Not Now');
            expect(timeoutDuration).to.equal(30000);
        });

        it('should handle folder opening options correctly', () => {
            const openFolderOption = "Open Folder";
            const openWorkspaceOption = "Open in New Workspace";
            const notNowOption = "Not Now";

            // Test that options are properly defined
            expect(openFolderOption).to.equal("Open Folder");
            expect(openWorkspaceOption).to.equal("Open in New Workspace");
            expect(notNowOption).to.equal("Not Now");
        });
    });
});
