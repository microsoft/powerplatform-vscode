/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import { Selectors } from '../helpers/selectors';

const EXTENSION_SERVER_URL = 'http://localhost:5050';

/**
 * Returns the VS Code Web URL for the test site.
 */
function getTestSiteUrl(): string {
    const url = process.env.PP_TEST_VSCODE_URL;
    if (!url) {
        throw new Error(
            'Missing required environment variable: PP_TEST_VSCODE_URL. ' +
            'Set it to the full VS Code Web URL from your browser.'
        );
    }
    return url;
}

/**
 * Custom Playwright fixture that:
 * 1. Navigates to the real vscode.dev with the test site URL
 * 2. Installs the locally-built extension via "Developer: Install Extension from Location..."
 * 3. Handles Microsoft authentication
 * 4. Waits for the site files to load
 */
export const test = base.extend<{ vsCodeWeb: Page }>({
    vsCodeWeb: async ({ context, page }, use) => {
        const url = getTestSiteUrl();

        // Pre-grant the Local Network Access / Private Network Access permission via CDP.
        // This suppresses the browser-level "wants to access other apps and services on
        // this device" permission prompt before vscode.dev fetches from localhost:5050.
        await grantLocalNetworkPermission(page, url);

        // Fallback: auto-dismiss the PNA dialog via DOM if the browser prompt still appears.
        // Use specific text to avoid matching the auth dialog ("wants to sign in using Microsoft").
        await page.addLocatorHandler(
            page.getByText('Access other apps and services on this device'),
            async () => {
                const allowBtn = page.getByRole('button', { name: 'Allow' });
                await allowBtn.click({ timeout: 2000 }).catch(() => { /* not clickable */ });
            }
        );

        // Navigate to vscode.dev with test site params
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Wait for VS Code Web workbench to load
        await page.waitForSelector(Selectors.workbench, { timeout: 60000 });

        // Handle auth first — login with the marketplace extension
        await handleAuthFlow(page, context);
        await handleAccountPicker(page);

        // Wait for status bar to indicate VS Code is ready
        await page.waitForSelector(Selectors.statusBar, { timeout: 60000 });

        // Handle "You are editing a live, public site" dialog
        await handleEditSiteDialog(page);

        // Wait for site files to load in the explorer tree
        await page.waitForSelector(Selectors.treeRow, { timeout: 60000 });

        // Now install the locally-built extension over the marketplace one
        await installLocalExtension(page);

        // Reload the page so the newly installed local extension is picked up
        // (replacing the marketplace version that was active during initial load)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForSelector(Selectors.workbench, { timeout: 60000 });

        // Re-authenticate after reload — the auth session needs to be re-established
        await handleAuthFlow(page, context);
        await handleAccountPicker(page);

        // Wait for VS Code to be ready again
        await page.waitForSelector(Selectors.statusBar, { timeout: 60000 });

        // Handle "You are editing a live, public site" dialog again after reload
        await handleEditSiteDialog(page);

        // Wait for site files to reload with the local extension active
        await page.waitForSelector(Selectors.treeRow, { timeout: 60000 });

        await use(page);
    },
});

/**
 * Install the locally-built extension using
 * "Developer: Install Extension from Location..."
 */
async function installLocalExtension(page: Page): Promise<void> {
    // Open command palette
    await page.keyboard.press('F1');
    const quickInput = page.locator(Selectors.quickInput);
    await quickInput.waitFor({ timeout: 10000 });

    // Type the command with '>' prefix for command mode
    const inputBox = quickInput.locator('input[type="text"]');
    await inputBox.fill('>Developer: Install Extension from Location');

    // Wait for the command to appear and click it
    const commandRow = quickInput.locator(Selectors.quickInputRow, {
        hasText: 'Install Extension from Location'
    });
    await commandRow.waitFor({ timeout: 10000 });
    await commandRow.click();

    // Wait for the URL input to appear and enter the local server URL
    const urlInput = quickInput.locator('input[type="text"]');
    await urlInput.waitFor({ timeout: 10000 });
    await urlInput.fill(EXTENSION_SERVER_URL);
    await page.keyboard.press('Enter');

    // Wait for installation notification to appear, confirming install succeeded
    const notifications = page.locator(Selectors.notificationsToasts);
    await notifications.waitFor({ timeout: 15000 }).catch(() => {
        // Notification may not appear in all cases
    });

    // Dismiss any reload prompt — the fixture handles reload explicitly
    try {
        const reloadButton = page.getByRole('button', { name: /reload|Reload/i });
        await reloadButton.waitFor({ timeout: 5000 });
        // Don't click — the fixture does a full page.reload() instead
    } catch {
        // No reload prompt
    }
}

async function handleAuthFlow(page: Page, context: BrowserContext): Promise<void> {
    const username = process.env.PP_TEST_USERNAME;
    const password = process.env.PP_TEST_PASSWORD;

    if (!username || !password) {
        throw new Error('PP_TEST_USERNAME and PP_TEST_PASSWORD environment variables are required');
    }

    try {
        const allowButton = page.getByRole('button', { name: 'Allow' });
        await allowButton.waitFor({ timeout: 20000 });

        const popupPromise = context.waitForEvent('page', { timeout: 30000 });
        await allowButton.click();

        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');
        await completeLogin(popup, username, password);

        await popup.waitForEvent('close', { timeout: 30000 }).catch(() => { /* already closed */ });
    } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.message.includes('Timeout');
        if (!isTimeout) {
            throw error;
        }
    }
}

async function handleAccountPicker(page: Page): Promise<void> {
    try {
        const quickInput = page.locator(Selectors.quickInput);
        await quickInput.waitFor({ timeout: 10000 });

        const accountOption = quickInput.locator('.quick-input-list .monaco-list-row').first();
        await accountOption.waitFor({ timeout: 5000 });
        await accountOption.click();
    } catch {
        // Account picker may not appear
    }
}

async function handleEditSiteDialog(page: Page): Promise<void> {
    try {
        const editSiteButton = page.getByRole('button', { name: 'Edit the site' });
        await editSiteButton.waitFor({ timeout: 15000 });
        await editSiteButton.click();
    } catch {
        // Dialog may not appear
    }
}

async function completeLogin(target: Page, username: string, password: string): Promise<void> {
    const emailInput = target.locator(Selectors.msLoginEmailInput);
    await emailInput.waitFor({ timeout: 15000 });
    await emailInput.fill(username);
    await target.locator(Selectors.msLoginNextButton).click();

    const passwordInput = target.locator(Selectors.msLoginPasswordInput);
    await passwordInput.waitFor({ timeout: 15000 });
    await passwordInput.fill(password);
    await target.locator(Selectors.msLoginNextButton).click();

    try {
        const staySignedIn = target.locator(Selectors.msLoginStaySignedIn);
        await staySignedIn.waitFor({ timeout: 5000 });
        await staySignedIn.click();
    } catch {
        // May not appear
    }
}

/**
 * Pre-grant the Local Network Access permission via CDP before navigation.
 *
 * Chrome 141+ (LNA) uses the permission name "local-network-access".
 * Older Chromium builds used "private-network-access". We try both,
 * plus a blanket Browser.grantPermissions call, swallowing errors
 * for whichever names the current Chromium doesn't recognise.
 */
async function grantLocalNetworkPermission(page: Page, testUrl: string): Promise<void> {
    const origin = new URL(testUrl).origin; // e.g. "https://vscode.dev"
    const cdpSession = await page.context().newCDPSession(page);

    // Try the current (Chrome 141+) permission name first
    const permissionNames = ['local-network-access', 'private-network-access'];
    for (const name of permissionNames) {
        await cdpSession.send('Browser.setPermission', {
            permission: { name },
            setting: 'granted',
            origin,
        }).catch(() => { /* name not recognised in this build */ });
    }

    // Also try the older Browser.grantPermissions API
    await cdpSession.send('Browser.grantPermissions', {
        origin,
        permissions: ['localNetworkAccess'],
    }).catch(() => { /* not supported */ });

    await cdpSession.detach().catch(() => { /* already detached */ });
}

export { expect } from '@playwright/test';
