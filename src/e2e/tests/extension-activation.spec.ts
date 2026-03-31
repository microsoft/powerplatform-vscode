/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { test, expect } from '../fixtures/vscode-web.fixture';
import { Selectors } from '../helpers/selectors';

test.describe('Extension Activation', () => {
    test('should activate without error dialogs', async ({ vsCodeWeb }) => {
        // Verify the workbench loaded
        await expect(vsCodeWeb.locator(Selectors.workbench)).toBeVisible();

        // Verify no error dialogs are shown
        const errorDialogs = vsCodeWeb.locator(Selectors.dialogBox);
        await expect(errorDialogs).toHaveCount(0);
    });

    test('should show the activity bar', async ({ vsCodeWeb }) => {
        await expect(vsCodeWeb.locator(Selectors.activityBar)).toBeVisible();
    });

    test('should show the status bar', async ({ vsCodeWeb }) => {
        await expect(vsCodeWeb.locator(Selectors.statusBar)).toBeVisible();
    });
});
