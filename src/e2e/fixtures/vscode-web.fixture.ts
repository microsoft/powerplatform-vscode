/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import { Selectors } from '../helpers/selectors';
import { getTestSiteUrl } from '../helpers/url-builder';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Path to cached auth state. Matches the path used in playwright.config.ts.
 * When present, the browser context is pre-loaded with saved cookies/localStorage,
 * so the Microsoft login dialog is typically skipped.
 */
export function getAuthStateDir(): string {
    return path.resolve(__dirname, '..', '.auth');
}

export function getAuthStatePath(): string {
    return path.join(getAuthStateDir(), 'storageState.json');
}

function hasValidStorageState(): boolean {
    return fs.existsSync(getAuthStatePath()) && !process.env.PP_FORCE_REAUTH;
}

async function saveStorageState(context: BrowserContext): Promise<void> {
    const authStateDir = getAuthStateDir();
    if (!fs.existsSync(authStateDir)) {
        fs.mkdirSync(authStateDir, { recursive: true });
    }
    await context.storageState({ path: getAuthStatePath() });
}

/**
 * Custom Playwright fixture that provides an authenticated VS Code Web page
 * with the Power Pages extension loaded and a test site opened.
 *
 * Auth flow:
 * 1. VS Code Web loads and shows "wants to sign in using Microsoft" dialog
 * 2. Click "Allow" to open the Microsoft login popup
 * 3. Fill in credentials in the popup
 * 4. Popup closes, extension activates with auth
 * 5. (Optional) "Select an account" quick pick appears — select the first account
 */

export const test = base.extend<{ vsCodeWeb: Page }>({
    vsCodeWeb: async ({ context, page }, use) => {
        const url = getTestSiteUrl();

        // Navigate to VS Code Web with test site params
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Wait for VS Code Web workbench to load
        await page.waitForSelector(Selectors.workbench, { timeout: 60000 });

        // Handle the "wants to sign in" dialog and subsequent login popup
        await handleAuthFlow(page, context);

        // Handle "Select an account for Power Platform Tools" quick pick
        await handleAccountPicker(page);

        // Wait for status bar to indicate VS Code is ready
        await page.waitForSelector(Selectors.statusBar, { timeout: 60000 });

        // Handle "You are editing a live, public site" confirmation dialog
        await handleEditSiteDialog(page);

        // Wait for extension to activate and site data to load — look for tree items in the explorer
        await page.waitForSelector(Selectors.treeRow, { timeout: 60000 });

        await use(page);
    },
});

async function handleAuthFlow(page: Page, context: BrowserContext): Promise<void> {
    const username = process.env.PP_TEST_USERNAME;
    const password = process.env.PP_TEST_PASSWORD;

    if (!username || !password) {
        throw new Error('PP_TEST_USERNAME and PP_TEST_PASSWORD environment variables are required');
    }

    try {
        // Step 1: Wait for "wants to sign in using Microsoft" dialog and click Allow
        // This triggers the login popup.
        // When storageState is loaded the dialog usually does not appear;
        // use a shorter timeout to avoid waiting unnecessarily.
        const authTimeout = hasValidStorageState() ? 5000 : 20000;
        const allowButton = page.getByRole('button', { name: 'Allow' });
        await allowButton.waitFor({ timeout: authTimeout });

        // Set up popup listener BEFORE clicking Allow
        const popupPromise = context.waitForEvent('page', { timeout: 30000 });
        await allowButton.click();

        // Step 2: Handle login in the popup
        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');
        await completeLoginOnPage(popup, username, password);

        // Wait for popup to close after successful login
        await popup.waitForEvent('close', { timeout: 30000 }).catch(() => { /* already closed */ });

        // Cache auth state for subsequent runs
        await saveStorageState(context);
    } catch (error: unknown) {
        // Auth dialog may not appear if already authenticated.
        // Only swallow timeout errors from waiting for the Allow button;
        // re-throw unexpected failures (network, credential, popup errors).
        const isTimeout = error instanceof Error && error.message.includes('Timeout');
        if (!isTimeout) {
            throw error;
        }
    }
}

async function handleAccountPicker(page: Page): Promise<void> {
    try {
        // When cached storage state is loaded, VS Code may show a quick pick
        // asking "Select an account for 'Power Platform Tools'" instead of
        // the Allow dialog. Click the first account option to proceed.
        const quickInput = page.locator(Selectors.quickInput);
        await quickInput.waitFor({ timeout: 10000 });

        const accountOption = quickInput.locator('.quick-input-list .monaco-list-row').first();
        await accountOption.waitFor({ timeout: 5000 });
        await accountOption.click();
    } catch {
        // Account picker may not appear if auth completed without it
    }
}

async function handleEditSiteDialog(page: Page): Promise<void> {
    try {
        const editSiteButton = page.getByRole('button', { name: 'Edit the site' });
        await editSiteButton.waitFor({ timeout: 15000 });
        await editSiteButton.click();
    } catch {
        // Dialog may not appear for non-public sites
    }
}

async function completeLoginOnPage(target: Page, username: string, password: string): Promise<void> {
    // Enter email
    const emailInput = target.locator(Selectors.msLoginEmailInput);
    await emailInput.waitFor({ timeout: 15000 });
    await emailInput.fill(username);
    await target.locator(Selectors.msLoginNextButton).click();

    // Wait for password input
    const passwordInput = target.locator(Selectors.msLoginPasswordInput);
    await passwordInput.waitFor({ timeout: 15000 });
    await passwordInput.fill(password);
    await target.locator(Selectors.msLoginNextButton).click();

    // Handle "Stay signed in?" prompt if it appears
    try {
        const staySignedIn = target.locator(Selectors.msLoginStaySignedIn);
        await staySignedIn.waitFor({ timeout: 5000 });
        await staySignedIn.click();
    } catch {
        // "Stay signed in?" prompt may not appear
    }
}

export { expect } from '@playwright/test';
