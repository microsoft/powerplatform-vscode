/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test, expect } from '../../fixtures/vscode-web-local.fixture';
import { Selectors } from '../../helpers/selectors';

/**
 * E2E web sanity test that verifies the locally-built extension
 * can be installed on vscode.dev, authenticate with a real Power Pages
 * environment, load site files, and perform an edit+save cycle.
 *
 * This single test covers: auth, site loading, tree rendering,
 * entity folders, file open, editor interaction, save, and revert.
 *
 * Required env vars: PP_TEST_VSCODE_URL, PP_TEST_USERNAME, PP_TEST_PASSWORD
 */
test.describe('Web Sanity', () => {
    test('should edit and save a file then revert', async ({ vsCodeWeb }) => {
        const explorer = vsCodeWeb.locator(Selectors.explorerViewlet);

        // Expand web-pages folder if not already expanded
        const webPagesFolder = explorer.locator(Selectors.treeRowLabel, { hasText: 'web-pages' });
        await expect(webPagesFolder).toBeVisible({ timeout: 60000 });

        const homeFolder = explorer.locator(Selectors.treeRowLabel, { hasText: /^Home$/ });
        if (!await homeFolder.isVisible()) {
            await webPagesFolder.dblclick({ force: true });
            await expect(homeFolder).toBeVisible({ timeout: 15000 });
        }
        await homeFolder.dblclick({ force: true });

        // Click the Home.en-US.webpage.copy.html file
        const homeHtmlFile = explorer.locator(Selectors.treeRowLabel, { hasText: 'Home.en-US.webpage.copy.html' });
        await expect(homeHtmlFile).toBeVisible({ timeout: 15000 });
        await homeHtmlFile.click();

        // Verify file opened in editor
        const editorTab = vsCodeWeb.locator(Selectors.tabLabel, { hasText: 'Home.en-US.webpage.copy.html' });
        await expect(editorTab).toBeVisible({ timeout: 15000 });

        // Click into the editor to focus it
        const editor = vsCodeWeb.locator('.monaco-editor').first();
        await editor.click();

        // Add a test comment at the end of the file
        await vsCodeWeb.keyboard.press('Control+End');
        await vsCodeWeb.keyboard.press('Enter');
        await vsCodeWeb.keyboard.type('<!-- e2e-sanity-test-marker -->', { delay: 50 });

        // Verify the file is now marked as modified (dirty tab indicator)
        const modifiedTab = vsCodeWeb.locator('.tab.dirty');
        await expect(modifiedTab).toBeVisible({ timeout: 5000 });

        // Save the file with Ctrl+S
        await vsCodeWeb.keyboard.press('Control+s');

        // Verify file is no longer marked as modified after save
        await expect(modifiedTab).not.toBeVisible({ timeout: 10000 });

        // Revert: undo the change with Ctrl+Z
        await editor.click();
        await vsCodeWeb.keyboard.press('Control+z');
        await vsCodeWeb.keyboard.press('Control+z');

        // File should be modified again after undo
        await expect(modifiedTab).toBeVisible({ timeout: 5000 });

        // Save the reverted file
        await vsCodeWeb.keyboard.press('Control+s');

        // Verify file is clean again
        await expect(modifiedTab).not.toBeVisible({ timeout: 10000 });

        // Verify no error dialogs appeared during the save operations
        const errorDialogs = vsCodeWeb.locator(Selectors.dialogBox);
        await expect(errorDialogs).toHaveCount(0);
    });
});
