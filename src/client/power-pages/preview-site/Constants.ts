/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export const Messages = {
    LOGIN: vscode.l10n.t("Login"),
    CANCEL: vscode.l10n.t("Cancel"),
    INSTALL: vscode.l10n.t("Install"),
    EDGE_DEV_TOOLS_NOT_INSTALLED_MESSAGE: vscode.l10n.t({ message: "The extension 'Microsoft Edge Tools' is required to run this command. Do you want to install it now?", comment: ["Do not translate 'Microsoft Edge Tools' "] }),
    OPENING_SITE_PREVIEW: vscode.l10n.t("Opening site preview..."),
    SITE_PREVIEW_FEATURE_NOT_ENABLED: vscode.l10n.t("Site runtime preview feature is not enabled."),
    NO_FOLDER_OPENED: vscode.l10n.t("No workspace folder opened. Please open a site folder to preview."),
    INITIALIZING_PREVIEW_TRY_AGAIN: vscode.l10n.t("Initializing site preview. Please try again after few seconds."),
    WEBSITE_NOT_FOUND_IN_ENVIRONMENT: vscode.l10n.t("Website not found in the environment. Please check the credentials and login with correct account."),
    INITIALIZING_PREVIEW: vscode.l10n.t("Initializing site preview"),
    GETTING_ORG_DETAILS: vscode.l10n.t("Getting organization details..."),
    GETTING_REGION_INFORMATION: vscode.l10n.t("Getting region information..."),
    FAILED_TO_GET_ENDPOINT: vscode.l10n.t("Failed to get website endpoint. Please try again later"),
    GETTING_WEBSITE_ENDPOINT: vscode.l10n.t("Getting website endpoint..."),
    ORG_DETAILS_ERROR: vscode.l10n.t("Failed to get organization details. Please try again later"),
    CLEARING_CACHE: vscode.l10n.t({
        message: "Clearing cache. See [details](https://aka.ms/pages-clear-cache).",
        comment: [
            "This is a markdown formatting which must persist across translations.",
            "The second line should be '[TRANSLATION HERE](https://aka.ms/pages-clear-cache).', keeping brackets and the text in the parentheses unmodified"
        ]
    }),
    CLEARING_SITE_CACHE: vscode.l10n.t("Clearing site cache"),
    AUTHENTICATING: vscode.l10n.t("Authenticating..."),
    UNABLE_TO_CLEAR_CACHE: vscode.l10n.t("Unable to clear cache"),
    PREVIEW_WARNING: vscode.l10n.t("Your preview isn't updated. Please upload your site to see the latest changes."),
    UPLOAD_CHANGES: vscode.l10n.t("Upload changes"),
    PREVIEW_SHOWN_FOR_PUBLISHED_CHANGES: vscode.l10n.t("The preview shown is for published changes. Please publish any pending changes to see them in the preview."),
    LOGIN_REQUIRED: vscode.l10n.t("Please login to preview the site.")
};

export const Events = {
    PREVIEW_SITE_INITIALIZED: "PreviewSiteInitialized",
    PREVIEW_SITE_INITIALIZATION_FAILED: "PreviewSiteInitializationFailed",
    PREVIEW_SITE_UPLOAD_WARNING_FAILED: "PreviewSiteUploadWarningFailed",
    PREVIEW_SITE_CLOSE_EXISTING_PREVIEW_FAILED: "PreviewSiteCloseExistingPreviewFailed"
}
