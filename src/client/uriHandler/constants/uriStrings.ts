/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

/**
 * Localized string constants for URI handler
 */
export const URI_HANDLER_STRINGS = {
    ERRORS: {
        URI_HANDLER_FAILED: vscode.l10n.t("Failed to handle Power Pages URI: {0}")
    },
    INFO: {
        DOWNLOAD_CANCELLED_AUTH: vscode.l10n.t("Site download cancelled. Authentication is required to proceed."),
        DOWNLOAD_CANCELLED_ENV: vscode.l10n.t("Site download cancelled. Correct environment connection is required."),
        DOWNLOAD_CANCELLED_FOLDER: vscode.l10n.t("Site download cancelled. No folder selected.")
    },
    PROMPTS: {
        AUTH_REQUIRED: vscode.l10n.t("You need to authenticate with Power Platform to download the site. Would you like to authenticate now?"),
        ENV_SWITCH_REQUIRED: vscode.l10n.t("You are currently connected to a different environment. Would you like to switch to the required environment?"),
        DOWNLOAD_COMPLETE: vscode.l10n.t("Power Pages site download completed successfully. Would you like to open the downloaded site folder?"),
        FOLDER_SELECT: vscode.l10n.t("Select Folder to Download Power Pages Site")
    },
    BUTTONS: {
        YES: vscode.l10n.t("Yes"),
        NO: vscode.l10n.t("No"),
        OPEN_FOLDER: vscode.l10n.t("Open Folder"),
        OPEN_NEW_WORKSPACE: vscode.l10n.t("Open in New Workspace"),
        NOT_NOW: vscode.l10n.t("Not Now")
    },
    TITLES: {
        DOWNLOAD_TITLE: vscode.l10n.t("Download Power Pages Site"),
        PCF_INIT: vscode.l10n.t({
            message: "Select Folder for new PCF Control",
            comment: ["Do not translate 'PCF' as it is a product name."]
        })
    }
} as const;
