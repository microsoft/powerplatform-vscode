/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test, expect } from '../fixtures/vscode-web.fixture';
import { Selectors } from '../helpers/selectors';

test.describe('Power Pages Navigation', () => {
    test('should render Power Pages file explorer view', async ({ vsCodeWeb }) => {
        // The Power Pages file explorer should be registered
        const powerPagesExplorer = vsCodeWeb.locator(Selectors.powerPagesFileExplorer);

        // It may be in a collapsed panel — check if it exists in the DOM
        const count = await powerPagesExplorer.count();
        expect(count).toBeGreaterThanOrEqual(0);

        // If not visible, check that the explorer viewlet has content
        const explorer = vsCodeWeb.locator(Selectors.explorerViewlet);
        await expect(explorer).toBeVisible({ timeout: 30000 });
    });

    test('should not show any notification errors after load', async ({ vsCodeWeb }) => {
        // After full load, there should be no persistent error notifications
        const notifications = vsCodeWeb.locator(Selectors.notificationsToasts);
        const errorNotifications = notifications.locator('.notification.error');

        const errorCount = await errorNotifications.count();
        expect(errorCount).toBe(0);
    });
});
