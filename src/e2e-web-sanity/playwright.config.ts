/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import dotenv from 'dotenv';

const extensionRootPath = path.resolve(__dirname, '..', '..');

// Load .env file from the sibling e2e directory (shared credentials)
dotenv.config({ path: path.resolve(__dirname, '..', 'e2e', '.env') });

/**
 * E2E Web Sanity tests for PR checks targeting release/stable.
 *
 * These tests navigate to the real vscode.dev site URL, install the
 * locally-built extension via "Developer: Install Extension from Location...",
 * authenticate, and verify the site loads correctly.
 *
 * Required environment variables:
 *   PP_TEST_VSCODE_URL  — full vscode.dev URL for the test site
 *   PP_TEST_USERNAME    — Microsoft account username
 *   PP_TEST_PASSWORD    — Microsoft account password
 */
export default defineConfig({
    testDir: './test',
    timeout: 300000,
    expect: {
        timeout: 30000,
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [
        ['html', { outputFolder: '../../playwright-report-web-sanity' }],
        ['junit', { outputFile: '../../test-results/web-sanity-results.xml' }],
        ['list'],
    ],
    use: {
        actionTimeout: 30000,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        ...devices['Desktop Chrome'],
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: {
                    args: [
                        // --- Local Network Access (LNA) / Private Network Access (PNA) bypass ---
                        // Chrome 141+ renamed PNA to LNA. When vscode.dev (public) fetches from
                        // localhost:5050 (private/loopback), the browser shows a permission prompt.
                        // We suppress it with three complementary layers:

                        // Layer 1: Override address-space classification so localhost is "public".
                        // Covers IPv4 loopback, hostname, and IPv6 loopback.
                        '--ip-address-space-overrides=127.0.0.1:5050=public,localhost:5050=public,[::1]:5050=public',

                        // Layer 2: Disable the LNA/PNA feature gates entirely.
                        // Includes both the new (LocalNetworkAccessChecks) and legacy
                        // (PrivateNetworkAccess*) feature names for cross-version coverage.
                        '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessPermissionPrompt,PrivateNetworkAccessRespectPreflightResults,PrivateNetworkAccessForNavigations,PrivateNetworkAccessForWorkers',

                        // Layer 3: Treat localhost as trusted even without TLS.
                        '--allow-insecure-localhost',
                    ],
                },
            },
        },
    ],
    webServer: {
        command: `npx http-server "${extensionRootPath}" -p 5050 --cors -c-1 --silent`,
        port: 5050,
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
    },
});
