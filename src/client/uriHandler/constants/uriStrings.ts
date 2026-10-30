/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

/**
 * Site setup page labels that other messages refer to by name. Defining each label once keeps
 * the instructions in those messages identical to the UI in every language.
 */
const AGENT_HOST_CONFIRM_LABELS = {
    START: vscode.l10n.t("Start creating"),
    TRY_AGAIN: vscode.l10n.t("Try again"),
    COPY: vscode.l10n.t("Copy"),
    TECHNICAL_DETAILS: vscode.l10n.t("Technical details"),
    CONDITIONAL_COMMAND: vscode.l10n.t("Runs only if needed")
};

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
        AGENT_HOST_SEQUENCE_RECOVERY: vscode.l10n.t("VS Code couldn't finish setup. Review the site setup page for next steps."),
        AGENTIC_CONFIRM_PANEL_UNAVAILABLE: vscode.l10n.t("VS Code couldn't open the site setup page. Run the command again."),
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
        RUNNING_STATUS: vscode.l10n.t("Preparing your AI assistant"),
        // {0} is the current step number, {1} is the total number of steps, and {2} is the localized step title.
        PROGRESS_STATUS: vscode.l10n.t("Step {0} of {1}: {2}"),
        // {0} is the current step number, {1} is the total number of steps, and {2} is the localized step title.
        SKIPPED_STATUS: vscode.l10n.t("Step {0} of {1}: {2}. Skipping a setup step that isn't needed."),
        SHELL_INTEGRATION_DISABLED_RECOVERY_STATUS: vscode.l10n.t({
            message: "VS Code couldn't run setup because terminal shell integration is turned off. The remaining setup commands didn't run. Turn on the Terminal › Integrated › Shell Integration: Enabled setting, and then select {0}.",
            args: [AGENT_HOST_CONFIRM_LABELS.TRY_AGAIN],
            comment: [
                "{0} is the localized label of the Try again button.",
                "'Terminal › Integrated › Shell Integration: Enabled' is the name of a VS Code setting."
            ]
        }),
        SHELL_INTEGRATION_RECOVERY_STATUS: vscode.l10n.t({
            message: "VS Code couldn't run setup because terminal shell integration wasn't ready. The remaining setup commands didn't run. Select {0}. If the problem continues, check the terminal's startup settings.",
            args: [AGENT_HOST_CONFIRM_LABELS.TRY_AGAIN],
            comment: ["{0} is the localized label of the Try again button."]
        }),
        UNSUPPORTED_SHELL_WINDOWS_RECOVERY_STATUS: vscode.l10n.t({
            message: "VS Code couldn't find PowerShell 7 or Git Bash. The remaining setup commands didn't run. Install one of them, or add its path to the Terminal › Integrated › Profiles: Windows user setting, and then select {0}.",
            args: [AGENT_HOST_CONFIRM_LABELS.TRY_AGAIN],
            comment: [
                "{0} is the localized label of the Try again button.",
                "'Terminal › Integrated › Profiles: Windows' is the name of a VS Code setting."
            ]
        }),
        UNSUPPORTED_SHELL_POSIX_RECOVERY_STATUS: vscode.l10n.t("VS Code can't run setup in your default terminal shell. The remaining setup commands didn't run. Set your default terminal shell to PowerShell, Bash, Zsh, or Fish, restart VS Code, and then start creating your site again."),
        UNSUPPORTED_HOST_EXECUTABLE_RECOVERY_STATUS: vscode.l10n.t({
            message: "VS Code can't safely pass your site description to this AI assistant installation because it starts from a batch file (.cmd or .bat). Install a version that starts from an .exe file or a PowerShell script (.ps1), and then select {0}. Copy isn't available for this installation.",
            args: [AGENT_HOST_CONFIRM_LABELS.TRY_AGAIN],
            comment: ["{0} is the localized label of the Try again button."]
        }),
        COMMAND_RECOVERY_STATUS: vscode.l10n.t({
            message: "VS Code couldn't complete this step: {0}. Select {2}, or open {1} to review the commands.",
            args: ["{0}", "{1}", AGENT_HOST_CONFIRM_LABELS.TRY_AGAIN],
            comment: [
                "{0} is the localized description of the command that failed and is replaced when the message is shown.",
                "{1} is the localized label of the Technical details section and is replaced when the message is shown.",
                "{2} is the localized label of the Try again button."
            ]
        }),
        COMMAND_RECOVERY_WITH_SETUP_OPTIONS_STATUS: vscode.l10n.t({
            message: "VS Code couldn't complete this step: {0}. Select {1} for installation and reload options, or select {2}.",
            args: ["{0}", "{1}", AGENT_HOST_CONFIRM_LABELS.TRY_AGAIN],
            comment: [
                "{0} is the localized description of the command that failed and is replaced when the message is shown.",
                "{1} is the localized label of the View setup options button and is replaced when the message is shown.",
                "{2} is the localized label of the Try again button."
            ]
        }),
        SUMMARY_HEADER: vscode.l10n.t("Summary"),
        SEQUENCE_HEADER: AGENT_HOST_CONFIRM_LABELS.TECHNICAL_DETAILS,
        SEQUENCE_DETAIL: vscode.l10n.t("Review the commands for this setup."),
        // {0} is the path of the terminal shell. {1} is the path of the site folder.
        MANUAL_COMMAND_DETAIL: vscode.l10n.t("To set up manually, open {0} in your site folder ({1}). Copy and run only the commands you still need, in order and one at a time. Stop if a command fails."),
        MANUAL_COMMAND_WITH_CHECKS_DETAIL: vscode.l10n.t({
            message: "To set up manually, open {0} in your site folder ({1}). Copy and run only the commands you still need, in order and one at a time. Run a command marked {2} only if the related read-only check shows that it's needed. Stop if a command fails.",
            args: ["{0}", "{1}", AGENT_HOST_CONFIRM_LABELS.CONDITIONAL_COMMAND],
            comment: [
                "{0} is the path of the terminal shell and is replaced when the message is shown.",
                "{1} is the path of the site folder and is replaced when the message is shown.",
                "{2} is the localized Runs only if needed label shown next to conditional commands."
            ]
        }),
        MANUAL_COMMAND_UNAVAILABLE: vscode.l10n.t("Copy isn't available for this terminal shell. Copy works with PowerShell, Bash, Zsh, and Fish."),
        MANUAL_COMMAND_UNAVAILABLE_HOST_EXECUTABLE: vscode.l10n.t("Copy isn't available for this AI assistant installation because it starts from a batch file (.cmd or .bat)."),
        COMMAND_PREVIEW_UNAVAILABLE: vscode.l10n.t("Command preview isn't available for this terminal shell."),
        RECOVERY_MANUAL_DETAIL: vscode.l10n.t({
            message: "To continue manually, open {0} and select {1} for each command you still need.",
            args: [AGENT_HOST_CONFIRM_LABELS.TECHNICAL_DETAILS, AGENT_HOST_CONFIRM_LABELS.COPY],
            comment: [
                "{0} is the localized label of the Technical details section.",
                "{1} is the localized label of the Copy button."
            ]
        }),
        COPY_COMMAND_LABEL: AGENT_HOST_CONFIRM_LABELS.COPY,
        COPY_COMMAND_ACCESSIBLE_LABEL: vscode.l10n.t("Copy command: {0}"),
        COPY_COMMAND_SUCCESS: vscode.l10n.t("Command copied: {0}."),
        COPY_COMMAND_FAILURE: vscode.l10n.t({
            message: "VS Code couldn't copy the command. Select {0} to try again.",
            args: [AGENT_HOST_CONFIRM_LABELS.COPY],
            comment: ["{0} is the localized label of the Copy button."]
        }),
        COPY_COMMAND_UNAVAILABLE: vscode.l10n.t("You can't copy this command now. Check its status and the manual setup instructions."),
        COMMAND_COMPLETED: vscode.l10n.t("Completed"),
        COMMAND_SKIPPED: vscode.l10n.t("Not needed"),
        HOST_LABEL: vscode.l10n.t("AI assistant"),
        FOLDER_LABEL: vscode.l10n.t("Site files"),
        SETUP_LABEL: vscode.l10n.t("Setup"),
        SETUP_READY: vscode.l10n.t("Power Pages plugin is installed"),
        SETUP_GUIDANCE_REQUIRED: vscode.l10n.t("VS Code will install the Power Pages plugin"),
        SETUP_ENABLE_REQUIRED: vscode.l10n.t("VS Code will enable the Power Pages plugin"),
        SETUP_CHECK_REQUIRED: vscode.l10n.t("VS Code will check the Power Pages plugin setup"),
        // {0} is the AI assistant display name.
        SETUP_ASSISTANT_REQUIRED: vscode.l10n.t("VS Code will install {0} and the Power Pages plugin"),
        WHAT_NEXT_HEADER: vscode.l10n.t("What happens next"),
        PREPARE_ASSISTANT_TITLE: vscode.l10n.t("Prepare your AI assistant"),
        PREPARE_ASSISTANT_DETAIL: vscode.l10n.t("Install the assistant if needed."),
        CHECK_GUIDANCE_TITLE: vscode.l10n.t("Prepare the Power Pages plugin"),
        CHECK_GUIDANCE_DETAIL: vscode.l10n.t("Install or enable the plugin if needed."),
        START_SITE_TITLE: vscode.l10n.t("Start your site"),
        START_SITE_DETAIL: vscode.l10n.t("Open a guided conversation in the VS Code terminal."),
        TRUST_NOTE: vscode.l10n.t({
            message: "VS Code won't change your setup until you select {0}. Your AI assistant might ask you to sign in.",
            args: [AGENT_HOST_CONFIRM_LABELS.START],
            comment: ["{0} is the localized label of the Start creating button."]
        }),
        READ_ONLY_CHECK: vscode.l10n.t("Read-only check"),
        CONDITIONAL_COMMAND: AGENT_HOST_CONFIRM_LABELS.CONDITIONAL_COMMAND,
        ALREADY_SETUP: vscode.l10n.t("Already set up"),
        MARKETPLACE_NAME: vscode.l10n.t("Power Platform Skills marketplace"),
        GUIDANCE_NAME: vscode.l10n.t("Power Pages plugin"),
        SITE_GOAL_LABEL: vscode.l10n.t("Site to create"),
        ASSISTANT_READY_DETAIL: vscode.l10n.t("Your selected AI assistant is installed."),
        START_LABEL: AGENT_HOST_CONFIRM_LABELS.START,
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
        RECOVERY_TITLE: vscode.l10n.t("VS Code couldn't prepare your AI assistant"),
        TRY_AGAIN_LABEL: AGENT_HOST_CONFIRM_LABELS.TRY_AGAIN,
        TRY_AGAIN_DETAIL: vscode.l10n.t("Try the setup again."),
        SETUP_OPTIONS_LABEL: vscode.l10n.t("View setup options"),
        SETUP_OPTIONS_DETAIL: vscode.l10n.t("Open installation and reload options."),
        // {0} is the agent host display name. Used as the integrated terminal name.
        TERMINAL_NAME: vscode.l10n.t("Power Pages Agent: {0}"),
        STEP_INSTALL_HOST: vscode.l10n.t("Install {0}"),
        STEP_REFRESH_PATH: vscode.l10n.t("Refresh the PATH environment variable"),
        STEP_VERIFY_HOST: vscode.l10n.t("Verify that {0} is available"),
        STEP_CHECK_MARKETPLACE: vscode.l10n.t("Check whether the Power Platform Skills marketplace is registered"),
        STEP_CHECK_PLUGIN: vscode.l10n.t("Check whether the Power Pages plugin is installed"),
        STEP_REGISTER_MARKETPLACE: vscode.l10n.t("Register the Power Platform Skills marketplace"),
        STEP_INSTALL_PLUGIN: vscode.l10n.t("Install the Power Pages plugin"),
        STEP_INSTALL_PLUGIN_USER_SCOPE: vscode.l10n.t("Install the Power Pages plugin for your user account"),
        STEP_ENABLE_PLUGIN: vscode.l10n.t("Enable the installed Power Pages plugin"),
        // {0} is the agent host display name.
        STEP_LAUNCH_HOST: vscode.l10n.t("Start {0} with your site description")
    }
} as const;
