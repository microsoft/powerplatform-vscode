/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test, expect } from '../fixtures/vscode-web.fixture';
import { Selectors } from '../helpers/selectors';

test.describe('Power Pages Navigation', () => {
    test('should render Power Pages file explorer view', async ({ vsCodeWeb }) => {
        // The explorer viewlet should be visible after load
        const explorer = vsCodeWeb.locator(Selectors.explorerViewlet);
        await expect(explorer).toBeVisible({ timeout: 30000 });

        // The Power Pages file explorer should be registered and present in the DOM
        const powerPagesExplorer = vsCodeWeb.locator(Selectors.powerPagesFileExplorer);
        const count = await powerPagesExplorer.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should not show any notification errors after load', async ({ vsCodeWeb }) => {
        // After full load, there should be no persistent error notifications
        const notifications = vsCodeWeb.locator(Selectors.notificationsToasts);
        const errorNotifications = notifications.locator('.notification.error');

        const errorCount = await errorNotifications.count();
        expect(errorCount).toBe(0);
    });
});
