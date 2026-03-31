/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test, expect } from '../fixtures/vscode-web.fixture';
import { Selectors } from '../helpers/selectors';

test.describe('Site File Tree', () => {
    test('should display the file explorer with site files', async ({ vsCodeWeb }) => {
        // The explorer should be visible
        const explorer = vsCodeWeb.locator(Selectors.explorerViewlet);
        await expect(explorer).toBeVisible({ timeout: 30000 });

        // Tree should have at least one row (site files loaded)
        const treeRows = explorer.locator(Selectors.treeRow);
        await expect(treeRows.first()).toBeVisible({ timeout: 60000 });
    });

    test('should show portal entity folders', async ({ vsCodeWeb }) => {
        const explorer = vsCodeWeb.locator(Selectors.explorerViewlet);

        // Common Power Pages entity folders (lowercase with hyphens)
        const expectedFolders = ['web-pages', 'web-files', 'content-snippets'];

        for (const folder of expectedFolders) {
            const folderLabel = explorer.locator(Selectors.treeRowLabel, { hasText: folder });
            await expect(folderLabel).toBeVisible({ timeout: 60000 });
        }
    });
});
