/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Load .env file from the e2e directory
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex).trim();
                const value = trimmed.substring(eqIndex + 1).trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        }
    }
}

/**
 * Path to cached auth state. Saved after first successful login and
 * reused on subsequent runs to skip the Microsoft login flow.
 * Delete this file or set PP_FORCE_REAUTH=1 to force a fresh login.
 */
const AUTH_STATE_PATH = path.resolve(__dirname, '.auth', 'storageState.json');
const useStorageState = fs.existsSync(AUTH_STATE_PATH) && !process.env.PP_FORCE_REAUTH;

export default defineConfig({
    testDir: './test',
    timeout: 120000,
    expect: {
        timeout: 30000,
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [
        ['html', { outputFolder: '../../playwright-report' }],
        ['junit', { outputFile: '../../test-results/e2e-results.xml' }],
        ['list'],
    ],
    use: {
        actionTimeout: 30000,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        storageState: useStorageState ? AUTH_STATE_PATH : undefined,
        ...devices['Desktop Chrome'],
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
