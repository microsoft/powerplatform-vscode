/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test, expect } from '../fixtures/vscode-web.fixture';
import { Selectors } from '../helpers/selectors';

test.describe('File Save Operations', () => {
    test('should edit and revert a Home page HTML file', async ({ vsCodeWeb }) => {
        const explorer = vsCodeWeb.locator(Selectors.explorerViewlet);

        // Expand web-pages folder (double-click to toggle expand)
        const webPagesFolder = explorer.locator(Selectors.treeRowLabel, { hasText: 'web-pages' });
        await expect(webPagesFolder).toBeVisible({ timeout: 60000 });
        await webPagesFolder.dblclick();
        // Wait for child nodes to appear after expanding web-pages folder
        const homeFolder = explorer.locator(Selectors.treeRowLabel, { hasText: /^Home$/ });
        await expect(homeFolder).toBeVisible({ timeout: 15000 });
        await homeFolder.dblclick();

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
        await vsCodeWeb.keyboard.type('<!-- e2e-test-marker -->', { delay: 50 });

        // Verify the file is now marked as modified (dot indicator on tab)
        const modifiedTab = vsCodeWeb.locator('.tab.dirty');
        await expect(modifiedTab).toBeVisible({ timeout: 5000 });

        // Save the file with Ctrl+S
        await vsCodeWeb.keyboard.press('Control+s');

        // Verify file is no longer marked as modified after save
        await expect(modifiedTab).not.toBeVisible({ timeout: 10000 });

        // Now revert: undo the change with Ctrl+Z multiple times
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
