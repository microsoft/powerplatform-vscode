/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test, expect } from '@playwright/test';
import { expandExplorerFolder } from '../../helpers/explorer';
import { Selectors } from '../../helpers/selectors';

const homeContents = `
    <div role="treeitem" data-folder="Home" aria-expanded="false" data-toggle-count="0">
        <button class="monaco-tl-twistie collapsible">Expand Home</button>
        <span class="monaco-icon-label">Home</span>
    </div>
    <div id="home-children" hidden>
        <div role="treeitem"><span class="monaco-icon-label">Home.en-US.webpage.copy.html</span></div>
    </div>`;

/**
 * Models VS Code's single-click folder toggles and asynchronous child loading.
 * @param expanded Whether the web-pages folder is already expanded.
 * @param lazy Whether its children are fetched asynchronously.
 * @returns The local Explorer fixture markup.
 */
function explorerContents(expanded = false, lazy = false): string {
    return `
        <div id="workbench.view.explorer" role="tree">
            <div role="treeitem" data-folder="web-pages" aria-expanded="${expanded}" data-toggle-count="0">
                <button class="monaco-tl-twistie collapsible">Expand web-pages</button>
                <span class="monaco-icon-label">web-pages</span>
            </div>
            <div id="web-pages-children" ${expanded && !lazy ? '' : 'hidden'}>
                ${lazy ? '' : homeContents}
            </div>
        </div>
        <script>
            const loadChildren = async () => {
                const response = await fetch('https://explorer.test/children');
                document.getElementById('web-pages-children').innerHTML = await response.text();
                document.getElementById('web-pages-children').hidden = false;
            };
            document.addEventListener('click', event => {
                const row = event.target.closest('[data-folder]');
                if (!row) return;
                const expanded = row.getAttribute('aria-expanded') !== 'true';
                row.setAttribute('aria-expanded', String(expanded));
                row.setAttribute('data-toggle-count', String(Number(row.getAttribute('data-toggle-count')) + 1));
                const children = document.getElementById(row.dataset.folder === 'Home' ? 'home-children' : 'web-pages-children');
                children.hidden = !expanded;
            });
            ${expanded && lazy ? 'loadChildren();' : ''}
        </script>`;
}

test.describe('Explorer folder navigation', () => {
    test('expands collapsed folders without double-clicking their labels', async ({ page }) => {
        await page.setContent(explorerContents());
        const explorer = page.locator(Selectors.explorerViewlet);
        const webPages = explorer.getByRole('treeitem').filter({ has: page.getByText('web-pages', { exact: true }) });

        await expandExplorerFolder(explorer, 'web-pages');
        await expandExplorerFolder(explorer, 'Home');

        await expect(webPages).toHaveAttribute('aria-expanded', 'true');
        await expect(webPages).toHaveAttribute('data-toggle-count', '1');
        await expect(explorer.getByText('Home.en-US.webpage.copy.html', { exact: true })).toBeVisible();
    });

    test('keeps already expanded folders open on repeated navigation', async ({ page }) => {
        await page.setContent(explorerContents(true));
        const explorer = page.locator(Selectors.explorerViewlet);
        const webPages = explorer.getByRole('treeitem').filter({ has: page.getByText('web-pages', { exact: true }) });
        const home = explorer.getByRole('treeitem').filter({ has: page.getByText('Home', { exact: true }) });

        await expandExplorerFolder(explorer, 'web-pages');
        await expandExplorerFolder(explorer, 'Home');
        await expandExplorerFolder(explorer, 'web-pages');
        await expandExplorerFolder(explorer, 'Home');

        await expect(webPages).toHaveAttribute('data-toggle-count', '0');
        await expect(home).toHaveAttribute('data-toggle-count', '1');
        await expect(explorer.getByText('Home.en-US.webpage.copy.html', { exact: true })).toBeVisible();
    });

    test('waits for children of an already expanded folder without collapsing it', async ({ page }) => {
        let releaseChildren: () => void = () => { throw new Error('Child response is not ready'); };
        const childrenReady = new Promise<void>(resolve => { releaseChildren = resolve; });
        await page.route('https://explorer.test/children', async route => {
            await childrenReady;
            await route.fulfill({
                body: homeContents,
                headers: { 'access-control-allow-origin': '*' },
            });
        });
        const childRequest = page.waitForRequest('https://explorer.test/children');
        await page.setContent(explorerContents(true, true));
        await childRequest;
        const explorer = page.locator(Selectors.explorerViewlet);
        const webPages = explorer.getByRole('treeitem').filter({ has: page.getByText('web-pages', { exact: true }) });

        await expandExplorerFolder(explorer, 'web-pages');
        await expect(explorer.getByText('Home', { exact: true })).toHaveCount(0);
        const homeExpansion = expandExplorerFolder(explorer, 'Home');
        releaseChildren();
        await homeExpansion;

        await expect(webPages).toHaveAttribute('aria-expanded', 'true');
        await expect(webPages).toHaveAttribute('data-toggle-count', '0');
        await expect(explorer.getByText('Home.en-US.webpage.copy.html', { exact: true })).toBeVisible();
    });
});
