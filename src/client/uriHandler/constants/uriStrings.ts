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
        URI_HANDLER_FAILED: vscode.l10n.t("Failed to handle Power Pages URI: {0}"),
        WEBSITE_ID_REQUIRED: vscode.l10n.t("Website ID is required"),
        ENVIRONMENT_ID_REQUIRED: vscode.l10n.t("Environment ID is required"),
        ORG_URL_REQUIRED: vscode.l10n.t("Organization URL is required"),
        AUTH_FAILED: vscode.l10n.t("Authentication failed after user initiated auth"),
        USER_CANCELLED_AUTH: vscode.l10n.t("User cancelled authentication"),
        ENV_SWITCH_FAILED: vscode.l10n.t("Failed to switch to the required environment. Please sign in with an account that has access to the target environment using 'pac auth create' command."),
        USER_CANCELLED_ENV_SWITCH: vscode.l10n.t("User cancelled environment switch"),
        USER_CANCELLED_FOLDER_SELECTION: vscode.l10n.t("User cancelled folder selection"),
        DOWNLOAD_FAILED: vscode.l10n.t("Download failed: {0}"),
        METADATA_DIFF_IMPORT_MISSING_FILE_PATH: vscode.l10n.t("Metadata diff import URI is missing the required 'filePath' query parameter."),
        METADATA_DIFF_IMPORT_INVALID_FILE_PATH: vscode.l10n.t("Metadata diff import URI must reference an absolute file path without '..' segments."),
        METADATA_DIFF_IMPORT_FAILED: vscode.l10n.t("Metadata diff import failed: {0}")
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
        FOLDER_SELECT: vscode.l10n.t("Select Folder to Download Power Pages Site"),
        AGENT_HOST_INSTALL_GUIDANCE: vscode.l10n.t({
            message: "{0} isn't installed. Install it, then choose {1} — most installs are picked up without restarting VS Code.",
            args: ["{0}", vscode.l10n.t("Check Again")],
            comment: [
                "{0} is the agent host display name and is replaced when the message is shown.",
                "{1} is the localized label of the Check Again button.",
                "Do not translate 'VS Code' as it is a product name."
            ]
        }),
        AGENT_HOST_INSTALL_RESUME: vscode.l10n.t("{0} is now installed. Resume creating your Power Pages site?")
    },
    BUTTONS: {
        YES: vscode.l10n.t("Yes"),
        NO: vscode.l10n.t("No"),
        SELECT_FOLDER: vscode.l10n.t("Select Folder"),
        OPEN_FOLDER: vscode.l10n.t("Open Folder"),
        OPEN_NEW_WORKSPACE: vscode.l10n.t("Open in New Workspace"),
        NOT_NOW: vscode.l10n.t("Not Now"),
        VIEW_INSTALLATION_GUIDE: vscode.l10n.t("View Installation Guide"),
        CHECK_AGAIN: vscode.l10n.t("Check Again"),
        DISMISS: vscode.l10n.t("Dismiss"),
        RELOAD_WINDOW: vscode.l10n.t("Reload Window"),
        RESUME: vscode.l10n.t("Resume")
    },
    AGENT_HOSTS: {
        COPILOT: vscode.l10n.t("GitHub Copilot CLI"),
        CLAUDE: vscode.l10n.t("Claude Code"),
        INSTALLED: vscode.l10n.t("Installed"),
        INSTALLED_WITH_VERSION: vscode.l10n.t("Installed · {0}")
    },
    TITLES: {
        DOWNLOAD_TITLE: vscode.l10n.t("Download Power Pages Site"),
        PCF_INIT: vscode.l10n.t({
            message: "Select Folder for new PCF Control",
            comment: ["Do not translate 'PCF' as it is a product name."]
        }),
        POWER_PAGES: vscode.l10n.t("Power Pages"),
        PAC_CLI: vscode.l10n.t("PAC CLI"),
        TARGET_FOLDER: vscode.l10n.t("Select Target Folder")
    },
    PROGRESS: {
        PREPARING: vscode.l10n.t("Preparing to open Power Pages site..."),
        VALIDATING_AUTH: vscode.l10n.t("Validating authentication..."),
        CHECKING_ENV: vscode.l10n.t("Checking environment..."),
        READY_TO_SELECT: vscode.l10n.t("Ready to select download folder"),
        AUTH_REQUIRED: vscode.l10n.t("Authentication required..."),
        AUTHENTICATING: vscode.l10n.t("Authenticating..."),
        SWITCHING_ENV: vscode.l10n.t("Switching environment...")
    },
    COMMANDS: {
        PAC_PCF_INIT: vscode.l10n.t("pac pcf init")
    },
    DESCRIPTIONS: {
        AGENT_HOST_NOT_INSTALLED: vscode.l10n.t("Not installed · Select to view installation guidance.")
    }
} as const;
