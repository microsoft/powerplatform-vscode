/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect, Locator } from '@playwright/test';
import { Selectors } from './selectors';

/**
 * Expands an Explorer folder without toggling an already expanded row.
 * @param explorer The file Explorer view.
 * @param name The exact folder label.
 * @returns A promise that resolves when the folder row is expanded.
 */
export async function expandExplorerFolder(explorer: Locator, name: string): Promise<void> {
    const folder = explorer.getByRole('treeitem').filter({
        has: explorer.page().getByText(name, { exact: true }),
    });
    await expect(folder).toBeVisible({ timeout: 60000 });
    await expect(folder).toHaveAttribute('aria-expanded', /^(true|false)$/, { timeout: 15000 });

    if (await folder.getAttribute('aria-expanded') === 'false') {
        // Label double-clicks can toggle twice when VS Code uses single-click expansion.
        await folder.locator(Selectors.treeRowCollapsibleTwistie).click();
    }

    await expect(folder).toHaveAttribute('aria-expanded', 'true', { timeout: 15000 });
}
