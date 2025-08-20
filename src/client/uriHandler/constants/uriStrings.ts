/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Localized string constants for URI handler
 */
export const URI_HANDLER_STRINGS = {
    ERRORS: {
        WEBSITE_ID_REQUIRED: "Website ID is required but not provided",
        ENVIRONMENT_ID_REQUIRED: "Environment ID is required but not provided",
        ORG_URL_REQUIRED: "Organization URL is required but not provided",
        AUTH_FAILED: "Authentication failed. Cannot proceed with site download.",
        ENV_SWITCH_FAILED: "Failed to switch to the required environment.",
        DOWNLOAD_FAILED: "Failed to download site: {0}",
        URI_HANDLER_FAILED: "Failed to handle Power Pages URI: {0}",
        ENV_SWITCH_ERROR: "Error switching environment: {0}"
    },
    INFO: {
        DOWNLOAD_CANCELLED_AUTH: "Site download cancelled. Authentication is required to proceed.",
        DOWNLOAD_CANCELLED_ENV: "Site download cancelled. Correct environment connection is required.",
        DOWNLOAD_CANCELLED_FOLDER: "Site download cancelled. No folder selected.",
        DOWNLOAD_STARTED: "Power Pages site download started using model version {0}. The terminal will show progress."
    },
    PROMPTS: {
        AUTH_REQUIRED: "You need to authenticate with Power Platform to download the site. Would you like to authenticate now?",
        ENV_SWITCH_REQUIRED: "You are currently connected to a different environment. Would you like to switch to the required environment?",
        DOWNLOAD_COMPLETE: "Power Pages site download should be complete. Would you like to open the downloaded site folder?",
        FOLDER_SELECT: "Select Folder to Download Power Pages Site"
    },
    BUTTONS: {
        YES: "Yes",
        NO: "No",
        OPEN_FOLDER: "Open Folder",
        OPEN_NEW_WORKSPACE: "Open in New Workspace",
        NOT_NOW: "Not Now"
    },
    TITLES: {
        DOWNLOAD_TITLE: "Download Power Pages Site",
        PCF_INIT: "Select Folder for new PCF Control"
    }
} as const;
