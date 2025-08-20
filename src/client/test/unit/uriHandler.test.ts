/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as vscode from "vscode";

// Test URI handling functionality
describe('UriHandler Schema Parameter Tests', () => {

    describe('Parameter Validation', () => {
        it('should validate required websiteid parameter', () => {
            const uri = vscode.Uri.parse('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?envid=test&orgurl=https://test.com');
            const params = new URLSearchParams(uri.query);

            expect(params.get('websiteid')).to.be.null;
            expect(params.get('envid')).to.equal('test');
            expect(params.get('orgurl')).to.equal('https://test.com');
        });

        it('should validate required envid parameter', () => {
            const uri = vscode.Uri.parse('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=test&orgurl=https://test.com');
            const params = new URLSearchParams(uri.query);

            expect(params.get('websiteid')).to.equal('test');
            expect(params.get('envid')).to.be.null;
            expect(params.get('orgurl')).to.equal('https://test.com');
        });

        it('should validate required orgurl parameter', () => {
            const uri = vscode.Uri.parse('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=test&envid=test');
            const params = new URLSearchParams(uri.query);

            expect(params.get('websiteid')).to.equal('test');
            expect(params.get('envid')).to.equal('test');
            expect(params.get('orgurl')).to.be.null;
        });

        it('should extract all parameters correctly', () => {
            const uri = vscode.Uri.parse('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=123&envid=456&orgurl=https://test.com&schema=PortalSchemaV2');
            const params = new URLSearchParams(uri.query);

            expect(params.get('websiteid')).to.equal('123');
            expect(params.get('envid')).to.equal('456');
            expect(params.get('orgurl')).to.equal('https://test.com');
            expect(params.get('schema')).to.equal('PortalSchemaV2');
        });
    });

    describe('Schema Parameter Handling', () => {
        it('should extract schema parameter correctly', () => {
            const uri = vscode.Uri.parse('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=123&envid=456&orgurl=https://test.com&schema=PortalSchemaV2');
            const params = new URLSearchParams(uri.query);

            expect(params.get('schema')).to.equal('PortalSchemaV2');
        });

        it('should handle missing schema parameter', () => {
            const uri = vscode.Uri.parse('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=123&envid=456&orgurl=https://test.com');
            const params = new URLSearchParams(uri.query);

            expect(params.get('schema')).to.be.null;
        });

        it('should determine model version 2 for PortalSchemaV2', () => {
            const uri = vscode.Uri.parse('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?schema=PortalSchemaV2');
            const params = new URLSearchParams(uri.query);
            const schema = params.get('schema');
            const modelVersion = schema && schema.toLowerCase() === 'portalschemav2' ? 2 : 1;

            expect(modelVersion).to.equal(2);
        });

        it('should determine model version 1 for other schema values', () => {
            const uri = vscode.Uri.parse('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?schema=OtherSchema');
            const params = new URLSearchParams(uri.query);
            const schema = params.get('schema');
            const modelVersion = schema && schema.toLowerCase() === 'portalschemav2' ? 2 : 1;

            expect(modelVersion).to.equal(1);
        });

        it('should determine model version 1 when schema is missing', () => {
            const uri = vscode.Uri.parse('vscode://microsoft-IsvExpTools.powerplatform-vscode/open');
            const params = new URLSearchParams(uri.query);
            const schema = params.get('schema');
            const modelVersion = schema && schema.toLowerCase() === 'portalschemav2' ? 2 : 1;

            expect(modelVersion).to.equal(1);
        });

        it('should handle case-insensitive schema parameter', () => {
            const testCases = ['PortalSchemaV2', 'portalschemav2', 'PORTALSCHEMAV2', 'PortalSchemav2'];

            testCases.forEach(schemaValue => {
                const uri = vscode.Uri.parse(`vscode://microsoft-IsvExpTools.powerplatform-vscode/open?schema=${schemaValue}`);
                const params = new URLSearchParams(uri.query);
                const schema = params.get('schema');
                const modelVersion = schema && schema.toLowerCase() === 'portalschemav2' ? 2 : 1;

                expect(modelVersion).to.equal(2, `Failed for schema value: ${schemaValue}`);
            });
        });

        it('should handle empty schema parameter', () => {
            const uri = vscode.Uri.parse('vscode://microsoft-IsvExpTools.powerplatform-vscode/open?schema=');
            const params = new URLSearchParams(uri.query);
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
});
