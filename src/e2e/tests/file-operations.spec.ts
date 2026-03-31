/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test, expect } from '../fixtures/vscode-web.fixture';
import { Selectors } from '../helpers/selectors';

test.describe('File Operations', () => {
    test('should open a file from the tree and display content in editor', async ({ vsCodeWeb }) => {
        const explorer = vsCodeWeb.locator(Selectors.explorerViewlet);

        // Wait for tree to load
        const treeRows = explorer.locator(Selectors.treeRow);
        await expect(treeRows.first()).toBeVisible({ timeout: 60000 });

        // Expand "Web Pages" folder if present
        const webPagesFolder = explorer.locator(Selectors.treeRowLabel, { hasText: 'Web Pages' });
        if (await webPagesFolder.isVisible()) {
            await webPagesFolder.dblclick();
            // Wait for children to load
            await vsCodeWeb.waitForTimeout(3000);
        }

        // Click the first available file (leaf node) in the tree
        const fileNodes = explorer.locator(`${Selectors.treeRow}[aria-level]`);
        const fileCount = await fileNodes.count();

        // Find a file node (not a folder) and click it
        for (let i = 0; i < fileCount && i < 20; i++) {
            const node = fileNodes.nth(i);
            const isExpanded = await node.getAttribute('aria-expanded');
            // Leaf nodes don't have aria-expanded attribute
            if (isExpanded === null) {
                await node.click();
                break;
            }
        }

        // Wait for editor to open
        await vsCodeWeb.waitForTimeout(3000);

        // Verify an editor tab appeared
        const editorTabs = vsCodeWeb.locator(Selectors.tabLabel);
        await expect(editorTabs.first()).toBeVisible({ timeout: 15000 });
    });
});
