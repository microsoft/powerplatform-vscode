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
        CREATE_FLOW_FAILED: vscode.l10n.t("Power Pages create flow could not continue. {0}"),
        AGENT_HOST_SEQUENCE_RECOVERY: vscode.l10n.t("Automatic command execution could not continue. Use the commands in the confirmation page as a manual reference."),
        DOWNLOAD_FAILED: vscode.l10n.t("Download failed: {0}"),
        SITE_DESCRIPTION_REQUIRED: vscode.l10n.t("Describe the site you want to create."),
        SITE_DESCRIPTION_TOO_LONG: vscode.l10n.t("Keep the site description under 1,000 characters.")
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
        AGENT_HOST_SELECT: vscode.l10n.t("Both assistants can guide you through creating a Power Pages site"),
        AGENT_HOST_INSTALL_GUIDANCE: vscode.l10n.t({
            message: "{0} isn't installed. Install it, then choose {1} — most installs are picked up without restarting VS Code.",
            args: ["{0}", vscode.l10n.t("Check Again")],
            comment: [
                "{0} is the agent host display name and is replaced when the message is shown.",
                "{1} is the localized label of the Check Again button.",
                "Do not translate 'VS Code' as it is a product name."
            ]
        }),
        AGENT_HOST_INSTALL_RESUME: vscode.l10n.t("{0} is now installed. Resume creating your Power Pages site?"),
        SITE_DESCRIPTION: vscode.l10n.t("Describe the purpose, audience, and key features. This will be sent to your selected AI assistant."),
        SITE_DESCRIPTION_PLACEHOLDER: vscode.l10n.t("For example: A volunteer portal for a food bank with event signup and donation information")
    },
    BUTTONS: {
        YES: vscode.l10n.t("Yes"),
        NO: vscode.l10n.t("No"),
        SELECT_FOLDER: vscode.l10n.t("Select Folder"),
        BROWSE: vscode.l10n.t("Browse..."),
        CHOOSE_ANOTHER_FOLDER: vscode.l10n.t("Choose another folder..."),
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
        INSTALLED: vscode.l10n.t("Ready to use"),
        INSTALLED_WITH_VERSION: vscode.l10n.t("Ready to use · {0}"),
        COPILOT_DETAIL: vscode.l10n.t("Choose this if you use GitHub Copilot. Opens a guided conversation in the VS Code terminal."),
        CLAUDE_DETAIL: vscode.l10n.t("Choose this if you use Claude. Opens a guided conversation in the VS Code terminal.")
    },
    TITLES: {
        DOWNLOAD_TITLE: vscode.l10n.t("Download Power Pages Site"),
        PCF_INIT: vscode.l10n.t({
            message: "Select Folder for new PCF Control",
            comment: ["Do not translate 'PCF' as it is a product name."]
        }),
        POWER_PAGES: vscode.l10n.t("Power Pages"),
        PAC_CLI: vscode.l10n.t("PAC CLI"),
        TARGET_FOLDER: vscode.l10n.t("Where should VS Code save your site files?"),
        TARGET_FOLDER_PLACEHOLDER: vscode.l10n.t("Choose an open folder or select another folder"),
        AI_ASSISTANT: vscode.l10n.t("Which AI assistant would you like to use?"),
        SITE_DESCRIPTION: vscode.l10n.t("What site would you like to create?")
    },
    PROGRESS: {
        PREPARING: vscode.l10n.t("Preparing to open Power Pages site..."),
        VALIDATING_AUTH: vscode.l10n.t("Validating authentication..."),
        CHECKING_ENV: vscode.l10n.t("Checking environment..."),
        READY_TO_SELECT: vscode.l10n.t("Ready to select download folder"),
        AUTH_REQUIRED: vscode.l10n.t("Authentication required..."),
        AUTHENTICATING: vscode.l10n.t("Authenticating..."),
        SWITCHING_ENV: vscode.l10n.t("Switching environment..."),
        CHECKING_ASSISTANT_SETUP: vscode.l10n.t("Checking your existing AI assistant setup...")
    },
    COMMANDS: {
        PAC_PCF_INIT: vscode.l10n.t("pac pcf init")
    },
    DESCRIPTIONS: {
        AGENT_HOST_NOT_INSTALLED: vscode.l10n.t("Not installed · VS Code can install it after you review the setup"),
        CURRENTLY_OPEN: vscode.l10n.t("Currently open"),
        SELECTED_FOLDER: vscode.l10n.t("Selected folder"),
        CHOOSE_ANOTHER_FOLDER: vscode.l10n.t("Select a folder on your computer")
    },
    AGENT_HOST_CONFIRM: {
        // Title of the confirmation webview panel tab.
        PANEL_TITLE: vscode.l10n.t("Create Power Pages Site"),
        TITLE: vscode.l10n.t("Ready to create your Power Pages site"),
        // {0} is the AI assistant display name.
        DESCRIPTION: vscode.l10n.t("VS Code will prepare {0}, check the Power Pages Plugin, and start a conversation to help you create your site. No command-line experience is required."),
        RUNNING_STATUS: vscode.l10n.t("Preparing your AI-assisted site setup..."),
        PROGRESS_STATUS: vscode.l10n.t("Step {0} of {1}: {2}"),
        SKIPPED_STATUS: vscode.l10n.t("{0} is already set up. Skipping this step."),
        SHELL_INTEGRATION_RECOVERY_STATUS: vscode.l10n.t("VS Code could not run the setup automatically. Your site files were not changed. Use Technical details below as a manual reference."),
        // {0} is the localized description of the command that failed.
        COMMAND_RECOVERY_STATUS: vscode.l10n.t("We couldn't finish this step: {0}. Your site files were not changed. Use Technical details below to continue manually."),
        SUMMARY_HEADER: vscode.l10n.t("Summary"),
        SEQUENCE_HEADER: vscode.l10n.t("Technical details"),
        SEQUENCE_DETAIL: vscode.l10n.t("View the exact checks and commands VS Code may run."),
        HOST_LABEL: vscode.l10n.t("AI assistant"),
        FOLDER_LABEL: vscode.l10n.t("Site files"),
        SETUP_LABEL: vscode.l10n.t("Setup"),
        SETUP_READY: vscode.l10n.t("Ready — Power Pages Plugin is already installed"),
        SETUP_GUIDANCE_REQUIRED: vscode.l10n.t("Power Pages Plugin will be installed"),
        SETUP_ASSISTANT_REQUIRED: vscode.l10n.t("AI assistant and Power Pages Plugin will be installed"),
        WHAT_NEXT_HEADER: vscode.l10n.t("What happens next"),
        PREPARE_ASSISTANT_TITLE: vscode.l10n.t("Prepare your AI assistant"),
        PREPARE_ASSISTANT_DETAIL: vscode.l10n.t("Install it first only when required."),
        CHECK_GUIDANCE_TITLE: vscode.l10n.t("Check the Power Pages Plugin"),
        CHECK_GUIDANCE_DETAIL: vscode.l10n.t("Reuse the existing plugin or install it if it is missing."),
        START_SITE_TITLE: vscode.l10n.t("Start creating your site"),
        START_SITE_DETAIL: vscode.l10n.t("Open a guided conversation in the terminal."),
        TRUST_NOTE: vscode.l10n.t("Nothing runs until you start. Your AI assistant may ask you to sign in the first time."),
        READ_ONLY_CHECK: vscode.l10n.t("Read-only check"),
        CONDITIONAL_COMMAND: vscode.l10n.t("Runs only if missing"),
        ALREADY_SETUP: vscode.l10n.t("Already set up — no action needed"),
        MARKETPLACE_NAME: vscode.l10n.t("Power Platform Skills marketplace"),
        GUIDANCE_NAME: vscode.l10n.t("Power Pages Plugin"),
        SITE_GOAL_LABEL: vscode.l10n.t("Site to create"),
        ASSISTANT_READY_DETAIL: vscode.l10n.t("Your selected AI assistant is ready to use."),
        START_LABEL: vscode.l10n.t("Start creating site"),
        START_DETAIL: vscode.l10n.t("Prepare the selected AI assistant and start a guided site-creation conversation."),
        EDIT_LABEL: vscode.l10n.t("Change choices"),
        EDIT_DETAIL: vscode.l10n.t("Return to save-location and AI-assistant selection."),
        CANCEL_LABEL: vscode.l10n.t("Cancel"),
        CANCEL_DETAIL: vscode.l10n.t("Close without running anything."),
        CLOSE_LABEL: vscode.l10n.t("Close"),
        CLOSE_DETAIL: vscode.l10n.t("Close this command reference."),
        HANDOFF_TITLE: vscode.l10n.t("Your AI assistant is ready"),
        HANDOFF_DETAIL: vscode.l10n.t("Continue in the terminal and follow the prompts to create your Power Pages site."),
        GO_TO_TERMINAL_LABEL: vscode.l10n.t("Go to terminal"),
        GO_TO_TERMINAL_DETAIL: vscode.l10n.t("Show the terminal containing your AI assistant conversation."),
        RECOVERY_TITLE: vscode.l10n.t("We couldn't finish preparing your AI assistant"),
        TRY_AGAIN_LABEL: vscode.l10n.t("Try again"),
        TRY_AGAIN_DETAIL: vscode.l10n.t("Run the approved setup again."),
        SETUP_OPTIONS_LABEL: vscode.l10n.t("More setup options"),
        SETUP_OPTIONS_DETAIL: vscode.l10n.t("Open installation guidance, detection, and reload options."),
        // {0} is the agent host display name. Used as the integrated terminal name.
        TERMINAL_NAME: vscode.l10n.t("Power Pages Agent: {0}"),
        STEP_INSTALL_HOST: vscode.l10n.t("Install {0}."),
        STEP_REFRESH_PATH: vscode.l10n.t("Refresh the terminal PATH."),
        STEP_VERIFY_HOST: vscode.l10n.t("Verify that {0} is available in this terminal."),
        STEP_CHECK_MARKETPLACE: vscode.l10n.t("Check whether the Power Platform Skills marketplace is already registered."),
        STEP_CHECK_PLUGIN: vscode.l10n.t("Check whether the Power Pages Plugin is already installed."),
        STEP_REGISTER_MARKETPLACE: vscode.l10n.t("Register the Power Platform Skills marketplace."),
        STEP_INSTALL_PLUGIN: vscode.l10n.t("Install the Power Pages plugin."),
        STEP_INSTALL_PLUGIN_USER_SCOPE: vscode.l10n.t("Install the Power Pages plugin (user scope)."),
        STEP_ENABLE_PLUGIN: vscode.l10n.t("Enable the existing Power Pages plugin."),
        // {0} is the agent host display name.
        STEP_LAUNCH_HOST: vscode.l10n.t("Start {0} with your site description.")
    }
} as const;
