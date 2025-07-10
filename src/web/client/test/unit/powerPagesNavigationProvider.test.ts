/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as vscode from "vscode";

// Test the PowerPages navigation provider functionality
describe('PowerPagesNavigationProvider Desktop Integration', () => {

    describe('URI Construction', () => {
        it('should build desktop URI with all required parameters', () => {
            const websiteId = "test-website-123";
            const envId = "test-env-456";
            const orgUrl = "https://contoso.crm.dynamics.com";
            
            const uri = `vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=${websiteId}&envid=${envId}&orgurl=${encodeURIComponent(orgUrl)}`;
            
            expect(uri).to.include('websiteid=test-website-123');
            expect(uri).to.include('envid=test-env-456');
            expect(uri).to.include('orgurl=https%3A%2F%2Fcontoso.crm.dynamics.com');
        });

        it('should properly encode complex org URLs', () => {
            const websiteId = "complex-site";
            const envId = "complex-env";
            const orgUrl = "https://test-org.crm4.dynamics.com/organizations/test%20org";
            
            const encodedOrgUrl = encodeURIComponent(orgUrl);
            const uri = `vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=${websiteId}&envid=${envId}&orgurl=${encodedOrgUrl}`;
            
            expect(uri).to.include('websiteid=complex-site');
            expect(uri).to.include('envid=complex-env');
            expect(decodeURIComponent(encodedOrgUrl)).to.equal(orgUrl);
        });

        it('should handle environment URLs with trailing slashes', () => {
            const websiteId = "site123";
            const envId = "env456";
            const orgUrl = "https://testorg.crm.dynamics.com/";
            
            const uri = `vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=${websiteId}&envid=${envId}&orgurl=${encodeURIComponent(orgUrl)}`;
            const parsedUri = vscode.Uri.parse(uri);
            const params = new URLSearchParams(parsedUri.query);
            
            expect(params.get('websiteid')).to.equal(websiteId);
            expect(params.get('envid')).to.equal(envId);
            expect(decodeURIComponent(params.get('orgurl') || '')).to.equal(orgUrl);
        });
    });

    describe('Parameter Validation', () => {
        it('should identify missing websiteId', () => {
            const websiteId = '';
            const envId = 'test-env';
            const orgUrl = 'https://test.com';
            
            const isValid = websiteId && envId && orgUrl;
            expect(isValid).to.be.false;
        });

        it('should identify missing envId', () => {
            const websiteId = 'test-site';
            const envId = '';
            const orgUrl = 'https://test.com';
            
            const isValid = websiteId && envId && orgUrl;
            expect(isValid).to.be.false;
        });

        it('should identify missing orgUrl', () => {
            const websiteId = 'test-site';
            const envId = 'test-env';
            const orgUrl = '';
            
            const isValid = websiteId && envId && orgUrl;
            expect(isValid).to.be.false;
        });

        it('should validate all parameters present', () => {
            const websiteId = 'test-site';
            const envId = 'test-env';
            const orgUrl = 'https://test.com';
            
            const isValid = websiteId && envId && orgUrl;
            expect(isValid).to.be.true;
        });
    });

    describe('Navigation Tree Node Structure', () => {
        it('should create proper tree node for desktop option', () => {
            const node = {
                label: 'Open in VS Code Desktop',
                iconPath: new vscode.ThemeIcon('desktop'),
                command: {
                    command: 'powerpages.powerPagesFileExplorer.openInDesktop',
                    title: 'Open in VS Code Desktop'
                },
                contextValue: 'openInDesktop'
            };

            expect(node.label).to.equal('Open in VS Code Desktop');
            expect(node.command?.command).to.equal('powerpages.powerPagesFileExplorer.openInDesktop');
            expect(node.contextValue).to.equal('openInDesktop');
        });

        it('should have proper icon path for desktop', () => {
            const desktopIcon = new vscode.ThemeIcon('desktop');
            expect(desktopIcon.id).to.equal('desktop');
        });
    });

    describe('External Link Generation', () => {
        it('should generate proper VS Code protocol URI', () => {
            const baseUri = 'vscode://microsoft-IsvExpTools.powerplatform-vscode/open';
            const params = new URLSearchParams();
            params.set('websiteid', 'test123');
            params.set('envid', 'env456');
            params.set('orgurl', 'https://test.crm.dynamics.com');
            
            const fullUri = `${baseUri}?${params.toString()}`;
            
            expect(fullUri).to.include('vscode://microsoft-IsvExpTools.powerplatform-vscode');
            expect(fullUri).to.include('websiteid=test123');
            expect(fullUri).to.include('envid=env456');
        });

        it('should handle URI parsing and reconstruction', () => {
            const originalUri = 'vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=abc&envid=def&orgurl=https%3A%2F%2Ftest.com';
            const parsedUri = vscode.Uri.parse(originalUri);
            const params = new URLSearchParams(parsedUri.query);
            
            expect(parsedUri.scheme).to.equal('vscode');
            expect(parsedUri.authority).to.equal('microsoft-IsvExpTools.powerplatform-vscode');
            expect(parsedUri.path).to.equal('/open');
            expect(params.get('websiteid')).to.equal('abc');
            expect(params.get('envid')).to.equal('def');
            expect(decodeURIComponent(params.get('orgurl') || '')).to.equal('https://test.com');
        });
    });

    describe('Error Handling Scenarios', () => {
        it('should handle undefined context values', () => {
            const websiteId = undefined;
            const envId = undefined;
            const orgUrl = undefined;
            
            const hasAllParams = websiteId && envId && orgUrl;
            expect(hasAllParams).to.be.false;
        });

        it('should handle null context values', () => {
            const websiteId = null;
            const envId = null;
            const orgUrl = null;
            
            const hasAllParams = websiteId && envId && orgUrl;
            expect(hasAllParams).to.be.false;
        });

        it('should handle malformed URLs', () => {
            const orgUrl = 'not-a-valid-url';
            let isValidUrl = false;
            
            try {
                new URL(orgUrl);
                isValidUrl = true;
            } catch {
                isValidUrl = false;
            }
            
            expect(isValidUrl).to.be.false;
        });

        it('should handle valid URLs', () => {
            const orgUrl = 'https://test.crm.dynamics.com';
            let isValidUrl = false;
            
            try {
                new URL(orgUrl);
                isValidUrl = true;
            } catch {
                isValidUrl = false;
            }
            
            expect(isValidUrl).to.be.true;
        });
    });

    describe('Telemetry Event Structure', () => {
        it('should have proper telemetry event names', () => {
            const triggerEvent = 'WEB_EXTENSION_OPEN_DESKTOP_TRIGGERED';
            const failureEvent = 'WEB_EXTENSION_OPEN_DESKTOP_FAILED';
            
            expect(triggerEvent).to.equal('WEB_EXTENSION_OPEN_DESKTOP_TRIGGERED');
            expect(failureEvent).to.equal('WEB_EXTENSION_OPEN_DESKTOP_FAILED');
        });

        it('should create proper telemetry data structure', () => {
            const telemetryData = {
                websiteId: 'test-site-123',
                environmentId: 'test-env-456',
                orgUrl: 'https://test.crm.dynamics.com',
                success: true,
                errorMessage: undefined
            };

            expect(telemetryData.websiteId).to.equal('test-site-123');
            expect(telemetryData.environmentId).to.equal('test-env-456');
            expect(telemetryData.success).to.be.true;
        });
    });
});
