/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Returns the VS Code Web URL for the test site.
 *
 * Set `PP_TEST_VSCODE_URL` to the full VS Code Web URL — the one you copy
 * from the browser when editing a Power Pages site. All query params
 * (org, site IDs, tenant, etc.) are already embedded in the URL.
 */
export function getTestSiteUrl(): string {
    const url = process.env.PP_TEST_VSCODE_URL;
    if (!url) {
        throw new Error(
            'Missing required environment variable: PP_TEST_VSCODE_URL. ' +
            'Set it to the full VS Code Web URL from your browser (e.g. https://insiders.vscode.dev/power/portal/webpages?...).'
        );
    }
    return url;
}
