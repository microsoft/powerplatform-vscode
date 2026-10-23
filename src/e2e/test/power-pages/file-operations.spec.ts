/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test, expect } from '../../fixtures/vscode-web.fixture';
import { Selectors } from '../../helpers/selectors';
import { expandExplorerFolder } from '../../helpers/explorer';

test.describe('File Operations', () => {
    test('should open a file from the tree and display content in editor', async ({ vsCodeWeb }) => {
        const explorer = vsCodeWeb.locator(Selectors.explorerViewlet);

        // Wait for tree to load
        const treeRows = explorer.locator(Selectors.treeRow);
        await expect(treeRows.first()).toBeVisible({ timeout: 60000 });

        await expandExplorerFolder(explorer, 'web-pages');
        await expandExplorerFolder(explorer, 'Home');

        // Click the first available file (leaf node) in the tree.
        // Leaf nodes are tree rows that lack a collapsible twistie (folders have one).
        const leafNodes = explorer.locator(`${Selectors.treeRow}[aria-level]`).filter({
            hasNot: vsCodeWeb.locator(Selectors.treeRowCollapsibleTwistie),
        });
        const firstFile = leafNodes.first();
        await expect(firstFile).toBeVisible({ timeout: 10000 });
        await firstFile.click();

        // Verify an editor tab appeared
        const editorTabs = vsCodeWeb.locator(Selectors.tabLabel);
        await expect(editorTabs.first()).toBeVisible({ timeout: 15000 });
    });
});
