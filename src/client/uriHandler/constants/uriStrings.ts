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
        AGENT_HOST_SEQUENCE_RECOVERY: vscode.l10n.t("We couldn't complete the setup. Review the confirmation page for details."),
        DOWNLOAD_FAILED: vscode.l10n.t("Download failed: {0}"),
        SITE_DESCRIPTION_REQUIRED: vscode.l10n.t("Describe the site you want to create."),
        SITE_DESCRIPTION_TOO_LONG: vscode.l10n.t("Enter 1,000 characters or fewer.")
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
        AGENT_HOST_SELECT: vscode.l10n.t("Both options start a guided site-creation conversation in the terminal."),
        AGENT_HOST_INSTALL_GUIDANCE: vscode.l10n.t({
            message: "{0} isn't installed. Install it, then select {1}. VS Code usually detects it without restarting.",
            args: ["{0}", vscode.l10n.t("Check again")],
            comment: [
                "{0} is the agent host display name and is replaced when the message is shown.",
                "{1} is the localized label of the Check again button.",
                "Do not translate 'VS Code' as it is a product name."
            ]
        }),
        AGENT_HOST_INSTALL_RESUME: vscode.l10n.t("{0} is installed. Continue creating your Power Pages site?"),
        SITE_DESCRIPTION: vscode.l10n.t("Your AI assistant uses this description to create the site. Include the purpose, audience, and key features."),
        SITE_DESCRIPTION_PLACEHOLDER: vscode.l10n.t("Example: A food bank site with volunteer signup and donation information")
    },
    BUTTONS: {
        YES: vscode.l10n.t("Yes"),
        NO: vscode.l10n.t("No"),
        SELECT_FOLDER: vscode.l10n.t("Select folder"),
        BROWSE: vscode.l10n.t("Browse..."),
        CHOOSE_ANOTHER_FOLDER: vscode.l10n.t("Browse for another folder"),
        OPEN_FOLDER: vscode.l10n.t("Open Folder"),
        OPEN_NEW_WORKSPACE: vscode.l10n.t("Open in New Workspace"),
        NOT_NOW: vscode.l10n.t("Not Now"),
        VIEW_INSTALLATION_GUIDE: vscode.l10n.t("View installation guide"),
        CHECK_AGAIN: vscode.l10n.t("Check again"),
        DISMISS: vscode.l10n.t("Dismiss"),
        RELOAD_WINDOW: vscode.l10n.t("Reload window"),
        RESUME: vscode.l10n.t("Continue")
    },
    AGENT_HOSTS: {
        COPILOT: vscode.l10n.t("GitHub Copilot CLI"),
        CLAUDE: vscode.l10n.t("Claude Code"),
        INSTALLED: vscode.l10n.t("Installed"),
        COPILOT_DETAIL: vscode.l10n.t("Start a guided site-creation conversation with GitHub Copilot CLI."),
        CLAUDE_DETAIL: vscode.l10n.t("Start a guided site-creation conversation with Claude Code.")
    },
    TITLES: {
        DOWNLOAD_TITLE: vscode.l10n.t("Download Power Pages Site"),
        PCF_INIT: vscode.l10n.t({
            message: "Select Folder for new PCF Control",
            comment: ["Do not translate 'PCF' as it is a product name."]
        }),
        POWER_PAGES: vscode.l10n.t("Power Pages"),
        PAC_CLI: vscode.l10n.t("PAC CLI"),
        TARGET_FOLDER: vscode.l10n.t("Select a folder for your site"),
        TARGET_FOLDER_PLACEHOLDER: vscode.l10n.t("Select an open folder, or browse for another"),
        AI_ASSISTANT: vscode.l10n.t("Choose an AI assistant"),
        SITE_DESCRIPTION: vscode.l10n.t("Describe the site you want to create")
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
        AGENT_HOST_NOT_INSTALLED: vscode.l10n.t("Not installed"),
        AGENT_HOST_NOT_INSTALLED_DETAIL: vscode.l10n.t("Install it in the next step after you review the setup."),
        CURRENTLY_OPEN: vscode.l10n.t("Open in VS Code"),
        SELECTED_FOLDER: vscode.l10n.t("Selected folder"),
        CHOOSE_ANOTHER_FOLDER: vscode.l10n.t("Select a folder on your device")
    },
    AGENT_HOST_CONFIRM: {
        // Title of the confirmation webview panel tab.
        PANEL_TITLE: vscode.l10n.t("Create a Power Pages site"),
        TITLE: vscode.l10n.t("Review your site setup"),
        // {0} is the AI assistant display name.
        DESCRIPTION: vscode.l10n.t("Review the details, then start a guided conversation with {0}. You don't need command-line experience."),
        RUNNING_STATUS: vscode.l10n.t("Preparing your AI assistant..."),
        PROGRESS_STATUS: vscode.l10n.t("Step {0} of {1}: {2}"),
        SKIPPED_STATUS: vscode.l10n.t("{0} is already set up."),
        SHELL_INTEGRATION_DISABLED_RECOVERY_STATUS: vscode.l10n.t("Terminal shell integration is turned off. Turn on Terminal › Integrated: Shell Integration Enabled in Settings, then try again. No site files were changed."),
        SHELL_INTEGRATION_RECOVERY_STATUS: vscode.l10n.t("The terminal wasn't ready in time. Close terminals you don't need, then try again. No site files were changed."),
        UNSUPPORTED_SHELL_WINDOWS_RECOVERY_STATUS: vscode.l10n.t("This terminal profile isn't supported. Choose PowerShell 7 or Bash as your default terminal profile, then try again. No site files were changed."),
        UNSUPPORTED_SHELL_POSIX_RECOVERY_STATUS: vscode.l10n.t("This terminal profile isn't supported. Choose PowerShell, Bash, Zsh, or Fish as your default terminal profile, then try again. No site files were changed."),
        UNSUPPORTED_HOST_EXECUTABLE_RECOVERY_STATUS: vscode.l10n.t("This AI assistant installation can't safely receive your site description. Reinstall the assistant, then try again. No site files were changed."),
        // {0} is the localized description of the command that failed. {1} is the localized label of the Technical details section.
        COMMAND_RECOVERY_STATUS: vscode.l10n.t("We couldn't complete this step: {0}. Review {1} for more information, or try again. No site files were changed."),
        // {0} is the localized description of the command that failed. {1} is the localized label of the setup-options button.
        COMMAND_RECOVERY_WITH_SETUP_OPTIONS_STATUS: vscode.l10n.t("We couldn't complete this step: {0}. Try again, or select {1}. No site files were changed."),
        SUMMARY_HEADER: vscode.l10n.t("Summary"),
        SEQUENCE_HEADER: vscode.l10n.t("Technical details"),
        SEQUENCE_DETAIL: vscode.l10n.t("See the exact commands VS Code might run."),
        HOST_LABEL: vscode.l10n.t("AI assistant"),
        FOLDER_LABEL: vscode.l10n.t("Site files"),
        SETUP_LABEL: vscode.l10n.t("Setup"),
        SETUP_READY: vscode.l10n.t("Power Pages Plugin is installed"),
        SETUP_GUIDANCE_REQUIRED: vscode.l10n.t("VS Code will install the Power Pages Plugin"),
        SETUP_ENABLE_REQUIRED: vscode.l10n.t("VS Code will enable the Power Pages Plugin"),
        SETUP_CHECK_REQUIRED: vscode.l10n.t("VS Code will check the Power Pages Plugin setup"),
        SETUP_ASSISTANT_REQUIRED: vscode.l10n.t("VS Code will install {0} and the Power Pages Plugin"),
        WHAT_NEXT_HEADER: vscode.l10n.t("What happens next"),
        PREPARE_ASSISTANT_TITLE: vscode.l10n.t("Prepare your AI assistant"),
        PREPARE_ASSISTANT_DETAIL: vscode.l10n.t("Install the assistant if needed."),
        CHECK_GUIDANCE_TITLE: vscode.l10n.t("Prepare the Power Pages Plugin"),
        CHECK_GUIDANCE_DETAIL: vscode.l10n.t("Install or enable the plugin if needed."),
        START_SITE_TITLE: vscode.l10n.t("Start your site"),
        START_SITE_DETAIL: vscode.l10n.t("Open a guided conversation in the VS Code terminal."),
        TRUST_NOTE: vscode.l10n.t("VS Code won't change your setup until you select Start creating. Your AI assistant might ask you to sign in."),
        READ_ONLY_CHECK: vscode.l10n.t("Read-only check"),
        CONDITIONAL_COMMAND: vscode.l10n.t("Runs only if needed"),
        ALREADY_SETUP: vscode.l10n.t("Already set up"),
        MARKETPLACE_NAME: vscode.l10n.t("Power Platform Skills marketplace"),
        GUIDANCE_NAME: vscode.l10n.t("Power Pages Plugin"),
        SITE_GOAL_LABEL: vscode.l10n.t("Site to create"),
        ASSISTANT_READY_DETAIL: vscode.l10n.t("Your selected AI assistant is installed."),
        START_LABEL: vscode.l10n.t("Start creating"),
        START_DETAIL: vscode.l10n.t("Prepare the selected AI assistant and start a guided site-creation conversation."),
        EDIT_LABEL: vscode.l10n.t("Change choices"),
        EDIT_DETAIL: vscode.l10n.t("Change the folder, AI assistant, or site description."),
        CANCEL_LABEL: vscode.l10n.t("Cancel"),
        CANCEL_DETAIL: vscode.l10n.t("Close without running anything."),
        CLOSE_LABEL: vscode.l10n.t("Close"),
        CLOSE_DETAIL: vscode.l10n.t("Close this page."),
        HANDOFF_TITLE: vscode.l10n.t("Continue in the terminal"),
        HANDOFF_DETAIL: vscode.l10n.t("Follow the prompts to create your Power Pages site."),
        GO_TO_TERMINAL_LABEL: vscode.l10n.t("Go to terminal"),
        GO_TO_TERMINAL_DETAIL: vscode.l10n.t("Show your AI assistant conversation in the terminal."),
        RECOVERY_TITLE: vscode.l10n.t("We couldn't prepare your AI assistant"),
        TRY_AGAIN_LABEL: vscode.l10n.t("Try again"),
        TRY_AGAIN_DETAIL: vscode.l10n.t("Try the setup again."),
        SETUP_OPTIONS_LABEL: vscode.l10n.t("View setup options"),
        SETUP_OPTIONS_DETAIL: vscode.l10n.t("Open installation and reload options."),
        // {0} is the agent host display name. Used as the integrated terminal name.
        TERMINAL_NAME: vscode.l10n.t("Power Pages Agent: {0}"),
        STEP_INSTALL_HOST: vscode.l10n.t("Install {0}"),
        STEP_REFRESH_PATH: vscode.l10n.t("Refresh the terminal PATH"),
        STEP_VERIFY_HOST: vscode.l10n.t("Verify that {0} is available in this terminal"),
        STEP_CHECK_MARKETPLACE: vscode.l10n.t("Check whether the Power Platform Skills marketplace is registered"),
        STEP_CHECK_PLUGIN: vscode.l10n.t("Check whether the Power Pages Plugin is installed"),
        STEP_REGISTER_MARKETPLACE: vscode.l10n.t("Register the Power Platform Skills marketplace"),
        STEP_INSTALL_PLUGIN: vscode.l10n.t("Install the Power Pages Plugin"),
        STEP_INSTALL_PLUGIN_USER_SCOPE: vscode.l10n.t("Install the Power Pages Plugin for your user account"),
        STEP_ENABLE_PLUGIN: vscode.l10n.t("Enable the installed Power Pages Plugin"),
        // {0} is the agent host display name.
        STEP_LAUNCH_HOST: vscode.l10n.t("Start {0} with your site description")
    }
} as const;
