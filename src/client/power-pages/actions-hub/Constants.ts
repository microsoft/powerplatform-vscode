/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

export const Constants = {
    ContextValues: {
        ENVIRONMENT_GROUP: "environmentGroup",
        ACTIVE_SITES_GROUP: "activeSitesGroup",
        INACTIVE_SITES_GROUP: "inactiveSitesGroup",
        CURRENT_ACTIVE_SITE: "currentActiveSite",
        NON_CURRENT_ACTIVE_SITE: "nonCurrentActiveSite",
        INACTIVE_SITE: "inactiveSite",
        OTHER_SITE: "otherSite",
        OTHER_SITES_GROUP: "otherSitesGroup",
        TOOLS_GROUP: "toolsGroup",
        NO_SITES: "noSites",
        ACCOUNT_MISMATCH: "accountMismatch",
        LOGIN_PROMPT: "loginPrompt",
        METADATA_DIFF_GROUP: "metadataDiffGroup",
        METADATA_DIFF_GROUP_WITH_RESULTS: "metadataDiffGroupWithResults",
        METADATA_DIFF_SITE: "metadataDiffSite",
        METADATA_DIFF_SITE_IMPORTED: "metadataDiffSiteImported",
        METADATA_DIFF_FOLDER: "metadataDiffFolder",
        METADATA_DIFF_FILE: "metadataDiffFile",
    },
    Commands: {
        METADATA_DIFF_OPEN_FILE: "microsoft.powerplatform.pages.actionsHub.metadataDiff.openFile",
        METADATA_DIFF_OPEN_ALL: "microsoft.powerplatform.pages.actionsHub.metadataDiff.openAll",
        METADATA_DIFF_CLEAR: "microsoft.powerplatform.pages.actionsHub.metadataDiff.clear",
        METADATA_DIFF_REMOVE_SITE: "microsoft.powerplatform.pages.actionsHub.metadataDiff.removeSite",
        METADATA_DIFF_VIEW_AS_TREE: "microsoft.powerplatform.pages.actionsHub.metadataDiff.viewAsTree",
        METADATA_DIFF_VIEW_AS_LIST: "microsoft.powerplatform.pages.actionsHub.metadataDiff.viewAsList",
        METADATA_DIFF_DISCARD_FILE: "microsoft.powerplatform.pages.actionsHub.metadataDiff.discardFile",
        METADATA_DIFF_DISCARD_FOLDER: "microsoft.powerplatform.pages.actionsHub.metadataDiff.discardFolder",
        METADATA_DIFF_SORT_BY_NAME: "microsoft.powerplatform.pages.actionsHub.metadataDiff.sortByName",
        METADATA_DIFF_SORT_BY_PATH: "microsoft.powerplatform.pages.actionsHub.metadataDiff.sortByPath",
        METADATA_DIFF_SORT_BY_STATUS: "microsoft.powerplatform.pages.actionsHub.metadataDiff.sortByStatus",
        METADATA_DIFF_GENERATE_HTML_REPORT: "microsoft.powerplatform.pages.actionsHub.metadataDiff.generateHtmlReport",
        METADATA_DIFF_EXPORT: "microsoft.powerplatform.pages.actionsHub.metadataDiff.export",
        METADATA_DIFF_IMPORT: "microsoft.powerplatform.pages.actionsHub.metadataDiff.import",
        METADATA_DIFF_RESYNC: "microsoft.powerplatform.pages.actionsHub.metadataDiff.resync",
        COMPARE_WITH_ENVIRONMENT: "microsoft-powerapps-portals.compareWithEnvironment",
    },
    Icons: {
        SITE: new vscode.ThemeIcon('globe'),
        IMPORTED_SITE: new vscode.ThemeIcon('cloud-download'),
        SITE_GROUP: vscode.ThemeIcon.Folder,
        OTHER_SITES: new vscode.ThemeIcon('archive'),
        TOOLS: new vscode.ThemeIcon('tools'),
        METADATA_DIFF_GROUP: new vscode.ThemeIcon('diff'),
        METADATA_DIFF_FOLDER: vscode.ThemeIcon.Folder,
    },
    Strings: {
        OTHER_SITES: vscode.l10n.t("Other Sites"),
        TOOLS: vscode.l10n.t("Tools"),
        ACTIVE_SITES: vscode.l10n.t("Active Sites"),
        INACTIVE_SITES: vscode.l10n.t("Inactive Sites"),
        NO_SITES_FOUND: vscode.l10n.t("No sites found"),
        NO_ENVIRONMENTS_FOUND: vscode.l10n.t("No environments found"),
        SELECT_ENVIRONMENT: vscode.l10n.t("Select an environment"),
        COPY_TO_CLIPBOARD: vscode.l10n.t("Copy to clipboard"),
        SESSION_DETAILS: vscode.l10n.t("Session Details"),
        CHANGING_ENVIRONMENT: vscode.l10n.t("Changing environment..."),
        CURRENT: vscode.l10n.t("Current"),
        LOCAL: vscode.l10n.t("Local"),
        LOCAL_SITE: vscode.l10n.t("Local Site"),
        SITE_MANAGEMENT_URL_NOT_FOUND: vscode.l10n.t("Site management URL not found for the selected site. Please try again after refreshing the environment."),
        SITE_UPLOAD_CONFIRMATION: vscode.l10n.t(`Be careful when you're updating public sites. The changes you make are visible to anyone immediately. Do you want to continue?`),
        YES: vscode.l10n.t("Yes"),
        CURRENT_SITE_PATH_NOT_FOUND: vscode.l10n.t("Current site path not found."),
        SITE_DETAILS: vscode.l10n.t("Site Details"),
        BROWSE: vscode.l10n.t("Browse..."),
        SELECT_DOWNLOAD_FOLDER: vscode.l10n.t("Select the folder that will contain your project root for your site"),
        SELECT_COMPILED_OUTPUT_FOLDER: vscode.l10n.t("Select the folder that contains your compiled output"),
        SELECT_FOLDER: vscode.l10n.t("Select Folder"),
        ENVIRONMENT_CHANGED_SUCCESSFULLY: vscode.l10n.t("Environment changed successfully."),
        ORGANIZATION_URL_MISSING: "Organization URL is missing in the results.",
        EMPTY_RESULTS_ARRAY: "Results array is empty or not an array.",
        PAC_AUTH_OUTPUT_FAILURE: "pacAuthCreateOutput is missing or unsuccessful.",
        CONFIGURATION_NAME: "powerPlatform.pages",
        DOWNLOAD_SETTING_NAME: "downloadSiteFolder",
        UPLOAD_CODE_SITE_COMPILED_OUTPUT_FOLDER_NOT_FOUND: vscode.l10n.t("Please select the folder that contains your compiled output to upload your site."),
        UPLOAD_CODE_SITE_FAILED: vscode.l10n.t("Upload failed. Please try again later."),
        POWER_PAGES_CONFIG_FILE_NAME: "powerpages.config.json",
        MISSING_REACTIVATION_URL_INFO: vscode.l10n.t("Missing required site information for reactivation."),
        // Account mismatch strings
        ACCOUNT_MISMATCH_DETECTED: vscode.l10n.t("VS Code - PAC CLI authentication mismatch detected"),
        ACCOUNT_MISMATCH_DESCRIPTION: vscode.l10n.t("Accounts don't match, data may not load."),
        ACCOUNT_MISMATCH_TOOLTIP: vscode.l10n.t("The account signed in to VS Code differs from the one authenticated in PAC CLI (Power Platform CLI). This mismatch can cause data not to load or actions to fail because UI commands run through the CLI. To fix it, sign in to VS Code using the same account as your PAC CLI. If needed, you can update your PAC CLI authentication separately via the command line."),
        LOGIN_PROMPT_LABEL: vscode.l10n.t("Sign in to VS Code with PAC CLI account"),
        LOGIN_PROMPT_TITLE: vscode.l10n.t("Login"),
        LOGIN_PROMPT_TOOLTIP: vscode.l10n.t("Click to authenticate with a matching account"),
        AUTHENTICATION_FAILED: vscode.l10n.t("Authentication failed. Please try again."),
        // CodeQL
        INSTALL: vscode.l10n.t("Install"),
        CANCEL: vscode.l10n.t("Cancel"),
        CODEQL_EXTENSION_NOT_INSTALLED: vscode.l10n.t("The CodeQL extension is required to run this command. Do you want to install it now?"),
        CODEQL_SCREENING_STARTED: vscode.l10n.t("CodeQL screening started. Creating database and analyzing"),
        CODEQL_DATABASE_CREATED: vscode.l10n.t("CodeQL database created successfully. You can now run queries from the CodeQL extension."),
        CODEQL_SCREENING_FAILED: vscode.l10n.t("CodeQL screening failed. Please try again later."),
        CODEQL_CURRENT_SITE_PATH_NOT_FOUND: vscode.l10n.t("Current site path not found. Please ensure you have a site folder open."),
        CODEQL_GUIDE_MESSAGE: vscode.l10n.t("CodeQL database created. You can now:\n\n1. Run custom queries if you have any\n2. Use the prebuilt queries from the CodeQL extension\n\nCheck the CodeQL extension panel for available queries."),
        SARIF_VIEWER_NOT_INSTALLED: vscode.l10n.t("The SARIF Viewer extension is recommended for viewing CodeQL results. Would you like to install it now?"),
        SARIF_VIEWER_INSTALL_FAILED: vscode.l10n.t("Failed to install SARIF viewer extension. Opening results as text file."),
        OPEN_AS_TEXT: vscode.l10n.t("Open as Text"),
        CODEQL_ANALYSIS_CHANNEL_NAME: "Power Platform Tools: CodeQL Analysis",
        CODEQL_ANALYSIS_STARTING: vscode.l10n.t("Starting CodeQL analysis for: {0}"),
        CODEQL_DATABASE_LOCATION: vscode.l10n.t("Database location: {0}"),
        CODEQL_CREATING_DATABASE: vscode.l10n.t("Creating CodeQL database..."),
        CODEQL_RUNNING_ANALYSIS: vscode.l10n.t("Running CodeQL analysis..."),
        CODEQL_ANALYSIS_COMPLETED: vscode.l10n.t("Analysis completed using query suite: {0}"),
        CODEQL_QUERY_SUITE_FAILED: vscode.l10n.t("Primary query suite {0} failed: {1}"),
        CODEQL_ANALYSIS_COMPLETE: vscode.l10n.t("Analysis complete! Results saved to: {0}"),
        CODEQL_ANALYSIS_ERROR: vscode.l10n.t("Error during CodeQL analysis: {0}"),
        CODEQL_ANALYSIS_FAILED: vscode.l10n.t("CodeQL analysis failed: {0}"),
        CODEQL_CLI_FOUND_AT: vscode.l10n.t("Found CodeQL CLI at: {0}"),
        CODEQL_CLI_NOT_INSTALLED: vscode.l10n.t("CodeQL CLI is not installed or not in PATH. Please install the CodeQL extension or add CodeQL CLI to your PATH."),
        CODEQL_VERSION: vscode.l10n.t("CodeQL version: {0}"),
        CODEQL_EXTENSION_NOT_INSTALLED_LOG: vscode.l10n.t("CodeQL extension is not installed."),
        CODEQL_ACTIVATING_EXTENSION: vscode.l10n.t("Activating CodeQL extension..."),
        CODEQL_USER_DATA_PATH_ERROR: vscode.l10n.t("Could not determine user data path."),
        CODEQL_LOOKING_FOR_CLI: vscode.l10n.t("Looking for CodeQL CLI in: {0}"),
        CODEQL_GLOBAL_STORAGE_NOT_EXISTS: vscode.l10n.t("CodeQL global storage path does not exist: {0}"),
        CODEQL_CLI_VIA_API: vscode.l10n.t("Found CodeQL CLI via extension API: {0}"),
        CODEQL_API_ERROR: vscode.l10n.t("Error getting CLI path from extension API: {0}"),
        CODEQL_CLI_NOT_LOCATED: vscode.l10n.t("Could not locate CodeQL CLI in global storage."),
        CODEQL_EXTENSION_ACCESS_ERROR: vscode.l10n.t("Error accessing CodeQL extension: {0}"),
        CODEQL_DISTRIBUTION_DIRS: vscode.l10n.t("Found distribution directories: {0}"),
        CODEQL_CLI_SEARCH_ERROR: vscode.l10n.t("Error searching for CodeQL CLI: {0}"),
        CODEQL_EXECUTING_COMMAND: vscode.l10n.t("Executing: {0}"),
        CODEQL_COMMAND_SUCCESS: vscode.l10n.t("Command completed successfully (exit code: {0})"),
        CODEQL_COMMAND_FAILED: vscode.l10n.t("Command failed with exit code: {0}"),
        CODEQL_COMMAND_FAILED_ERROR: vscode.l10n.t("Command failed with exit code {0}: {1}"),
        CODEQL_PROCESS_ERROR: vscode.l10n.t("Process error: {0}"),
        CODEQL_ISSUES_FOUND: vscode.l10n.t("Found {0} issue(s):"),
        CODEQL_NO_MESSAGE: vscode.l10n.t("No message"),
        CODEQL_FILE_LABEL: vscode.l10n.t("File: {0}"),
        CODEQL_LINE_LABEL: vscode.l10n.t("Line: {0}"),
        CODEQL_NO_ISSUES_FOUND: vscode.l10n.t("No issues found!"),
        CODEQL_NO_ANALYSIS_RESULTS: vscode.l10n.t("No analysis results found."),
        CODEQL_ANALYSIS_SUCCESS_NO_ISSUES: vscode.l10n.t("CodeQL analysis completed successfully with no issues found! 🎉"),
        CODEQL_ERROR_READING_RESULTS: vscode.l10n.t("Error reading results: {0}"),
        CODEQL_SARIF_VIEWER_NOT_FOUND: vscode.l10n.t("SARIF viewer extension not found."),
        CODEQL_INSTALLING_SARIF_VIEWER: vscode.l10n.t("Installing SARIF viewer extension..."),
        CODEQL_SARIF_VIEWER_INSTALLED: vscode.l10n.t("SARIF viewer extension installed successfully. Activating..."),
        CODEQL_OPENING_WITH_NEW_SARIF_VIEWER: vscode.l10n.t("Opening results with newly installed SARIF viewer..."),
        CODEQL_SARIF_VIEWER_OPENED: vscode.l10n.t("Results opened in SARIF viewer successfully."),
        CODEQL_SARIF_VIEWER_API_NOT_AVAILABLE: vscode.l10n.t("Extension installed but API not available yet. Opening as text file..."),
        CODEQL_SARIF_VIEWER_INSTALL_ERROR: vscode.l10n.t("Failed to install SARIF viewer extension: {0}"),
        CODEQL_USER_CANCELLED: vscode.l10n.t("User cancelled opening results."),
        CODEQL_ACTIVATING_SARIF_VIEWER: vscode.l10n.t("Activating SARIF viewer extension..."),
        CODEQL_OPENING_WITH_SARIF_VIEWER: vscode.l10n.t("Opening results with SARIF viewer..."),
        CODEQL_SARIF_VIEWER_API_FALLBACK: vscode.l10n.t("SARIF viewer extension does not expose expected API. Falling back to text editor..."),
        CODEQL_SARIF_VIEWER_ERROR: vscode.l10n.t("Error opening with SARIF viewer: {0}"),
        CODEQL_ANALYSIS_COMPLETED_OPEN_FILE: vscode.l10n.t("CodeQL analysis completed. Would you like to open the full results file?"),
        CODEQL_OPEN_RESULTS: vscode.l10n.t("Open Results"),
        CODEQL_CLOSE: vscode.l10n.t("Close"),
        CODEQL_ERROR_OPENING_RESULTS: vscode.l10n.t("Error opening results file: {0}"),
        CODEQL_DATABASE_FOLDER_PROMPT: vscode.l10n.t("Select folder for CodeQL database"),
        CODEQL_USE_CURRENT_SITE_FOLDER: vscode.l10n.t("Use current site folder"),
        CODEQL_SCREENING_NOT_SUPPORTED: vscode.l10n.t("CodeQL screening is not supported for this site."),
        CODEQL_CONFIG_FILE_FOUND: vscode.l10n.t("Found PowerPages config file: {0}"),
        CODEQL_USING_CUSTOM_QUERY: vscode.l10n.t("Using custom CodeQL query suite: {0}"),
        CODEQL_ADDED_DEFAULT_QUERY_TO_CONFIG: vscode.l10n.t("Added default query suite to config: {0}"),
        CODEQL_CREATED_CONFIG_FILE: vscode.l10n.t("Created PowerPages config file at {0} with default query suite: {1}"),
        CODEQL_CONFIG_ERROR: vscode.l10n.t("Error reading config file: {0}"),
        CODEQL_USING_DEFAULT_QUERY: vscode.l10n.t("Using default query suite: {0}"),
        CODEQL_CONFIG_FILE_CREATED_SUCCESSFULLY: vscode.l10n.t("PowerPages config file created successfully: {0}"),
        CODEQL_CONFIG_FILE_CREATE_ERROR: vscode.l10n.t("Error creating config file: {0}"),
        CODEQL_CONFIG_FILE_UPDATED_SUCCESSFULLY: vscode.l10n.t("PowerPages config file updated successfully: {0}"),
        CODEQL_CONFIG_FILE_UPDATE_ERROR: vscode.l10n.t("Error updating config file: {0}"),
        NO_WORKSPACE_FOLDER_OPEN: vscode.l10n.t("No workspace folder is open. Please open a folder containing your Power Pages site."),
        WEBSITE_ID_NOT_FOUND: vscode.l10n.t("Website ID not found. Please ensure you have a valid Power Pages site open."),
        COMPARE_WITH_LOCAL_SITE_DOWNLOAD_FAILED: vscode.l10n.t("Site download failed. Please try again later."),
        NO_DIFFERENCES_FOUND: vscode.l10n.t("No differences found between the remote site and your local workspace."),
        COMPARING_FILES: vscode.l10n.t("Comparing files..."),
        METADATA_DIFF_GROUP: vscode.l10n.t("Metadata Diff"),
        METADATA_DIFF_MODIFIED: vscode.l10n.t("Modified"),
        METADATA_DIFF_ADDED: vscode.l10n.t("Added locally"),
        METADATA_DIFF_DELETED: vscode.l10n.t("Deleted locally"),
        COMPARE_WITH_LOCAL_COMPLETED: vscode.l10n.t("Download is complete. You can now view the report."),
        SELECT_ENVIRONMENT_TO_COMPARE: vscode.l10n.t("Select an environment to compare with"),
        SELECT_WEBSITE_TO_COMPARE: vscode.l10n.t("Select a website to compare with"),
        NO_SITES_FOUND_IN_ENVIRONMENT: vscode.l10n.t("No sites found in the selected environment."),
        MATCHING_SITE_INDICATOR: vscode.l10n.t("Matching Site"),
        ENHANCED_DATA_MODEL: vscode.l10n.t("Enhanced Data Model"),
        STANDARD_DATA_MODEL: vscode.l10n.t("Standard Data Model"),
        DIFFERENT_WEBSITE_CONFIRMATION: vscode.l10n.t("The website you selected is different from the local site. Are you sure you want to compare with this website?"),
        YES_DONT_ASK_AGAIN: vscode.l10n.t("Yes, Don't Ask Again"),
        WEBSITE_NOT_FOUND_IN_ENVIRONMENT: vscode.l10n.t("The website was not found in the selected environment. Please select a different environment."),
        DISCARD_CHANGES: vscode.l10n.t("Discard Changes"),
        SHOW_DIFF: vscode.l10n.t("Show Diff"),
        METADATA_DIFF_ONLY_BINARY_FILES: vscode.l10n.t("All changed files are binary files (e.g., images) and cannot be displayed in the diff viewer. You can view them individually in the file tree."),
        FILE_COUNT_DESCRIPTION_SINGULAR: vscode.l10n.t("1 file changed"),
        SAVE_REPORT: vscode.l10n.t("Save Report"),
        SAVE_HTML_REPORT_TITLE: vscode.l10n.t("Save HTML Report"),
        OPEN_REPORT: vscode.l10n.t("Open Report"),
        // HTML Report labels
        HTML_REPORT_TITLE: vscode.l10n.t("Metadata Diff Report"),
        HTML_REPORT_SUBTITLE: vscode.l10n.t("Power Pages Site Comparison Results"),
        HTML_REPORT_TOTAL_CHANGES: vscode.l10n.t("Total Changes"),
        HTML_REPORT_ADDED: vscode.l10n.t("Added"),
        HTML_REPORT_MODIFIED: vscode.l10n.t("Modified"),
        HTML_REPORT_DELETED: vscode.l10n.t("Deleted"),
        HTML_REPORT_COMPARISON_DETAILS: vscode.l10n.t("Comparison Details"),
        HTML_REPORT_SITE_NAME_LABEL: vscode.l10n.t("Site Name:"),
        HTML_REPORT_ENVIRONMENT_LABEL: vscode.l10n.t("Environment:"),
        HTML_REPORT_GENERATED_LABEL: vscode.l10n.t("Generated:"),
        HTML_REPORT_CHANGED_FILES: vscode.l10n.t("Changed Files"),
        HTML_REPORT_CLICK_TO_EXPAND: vscode.l10n.t("(click to expand diff)"),
        HTML_REPORT_EXPAND_ALL: vscode.l10n.t("Expand All"),
        HTML_REPORT_COLLAPSE_ALL: vscode.l10n.t("Collapse All"),
        HTML_REPORT_GENERATED_BY: vscode.l10n.t("Generated by"),
        HTML_REPORT_EXTENSION_NAME: vscode.l10n.t("Power Platform Tools VS Code Extension"),
        // HTML Report status texts
        HTML_REPORT_STATUS_MODIFIED: vscode.l10n.t("Modified"),
        HTML_REPORT_STATUS_ADDED: vscode.l10n.t("Added Locally"),
        HTML_REPORT_STATUS_DELETED: vscode.l10n.t("Deleted Locally"),
        HTML_REPORT_STATUS_UNKNOWN: vscode.l10n.t("Unknown"),
        // HTML Report diff messages
        HTML_REPORT_BINARY_FILE_MESSAGE: vscode.l10n.t("Binary file - content comparison not available"),
        HTML_REPORT_UNABLE_TO_READ_CONTENTS: vscode.l10n.t("Unable to read file contents"),
        HTML_REPORT_UNABLE_TO_READ_LOCAL: vscode.l10n.t("Unable to read local file"),
        HTML_REPORT_UNABLE_TO_READ_REMOTE: vscode.l10n.t("Unable to read remote file"),
        HTML_REPORT_UNABLE_TO_READ_BOTH: vscode.l10n.t("Unable to read one or both files"),
        // Export/Import strings
        METADATA_DIFF_EXPORT_PROGRESS: vscode.l10n.t("Exporting comparison..."),
        METADATA_DIFF_EXPORT_TITLE: vscode.l10n.t("Export Metadata Diff"),
        METADATA_DIFF_IMPORT_PROGRESS: vscode.l10n.t("Importing comparison..."),
        METADATA_DIFF_EXPORT_INVALID_FILE: vscode.l10n.t("Invalid file format. The file does not contain valid metadata diff data."),
        METADATA_DIFF_EXPORT_UNSUPPORTED_VERSION: vscode.l10n.t("Unsupported version. This file was created with a newer version of the extension."),
        METADATA_DIFF_EXPORT_NEWER_EXTENSION_VERSION: vscode.l10n.t("This file was exported with a newer version of the extension. Please update your extension to import this file."),
        METADATA_DIFF_EXPORT_FILTER_NAME: vscode.l10n.t("Metadata Diff JSON"),
        METADATA_DIFF_BINARY_FILE_NOT_AVAILABLE: vscode.l10n.t("Binary file content is not available in imported comparisons. The original file was not included in the export."),
        METADATA_DIFF_REPLACE_EXISTING_IMPORT: vscode.l10n.t("An imported comparison already exists for this site. Do you want to replace it?"),
        REPLACE: vscode.l10n.t("Replace"),
        METADATA_DIFF_RESYNC_COMPLETED: vscode.l10n.t("Comparison has been refreshed with the latest data from the environment."),
        METADATA_DIFF_CANNOT_RESYNC_IMPORTED: vscode.l10n.t("Cannot refresh an imported comparison. Import a new file or run a new comparison."),
    },
    /**
     * Functions that return localized strings with dynamic parameters.
     * Use these for strings that require runtime values.
     */
    StringFunctions: {
        /**
         * Returns the fetching websites message with environment name
         */
        FETCHING_WEBSITES_FROM_ENVIRONMENT: (environmentName: string) =>
            vscode.l10n.t({
                message: "Fetching websites from '{0}'...",
                args: [environmentName],
                comment: ["Message shown while fetching websites from an environment. {0} is the environment name."]
            }),
        /**
         * Returns the downloading site message with site name
         */
        DOWNLOADING_SITE_FOR_COMPARISON: (siteName: string) =>
            vscode.l10n.t({
                message: "Downloading {0} site metadata ([details](command:microsoft.powerplatform.pages.actionsHub.showOutputChannel \"Show download output\"))...",
                args: [siteName],
                comment: ["This is a markdown formatting which must persist across translations."]
            }),
        /**
         * Returns the comparison label showing remote and local site without file count
         * Format: "<Remote Website Name> (Environment Name) <-> <Local Website Name> (Local)"
         */
        COMPARISON_LABEL: (remoteSiteName: string, environmentName: string, localSiteName: string) =>
            vscode.l10n.t({
                message: "{0} ({1}) ↔ {2} (Local)",
                args: [remoteSiteName, environmentName, localSiteName],
                comment: ["Comparison label showing remote and local sites. Format: 'Remote (Env) ↔ Local (Local)'."]
            }),
        /**
         * Returns the file count description (plural: "X files changed")
         */
        FILE_COUNT_DESCRIPTION_PLURAL: (fileCount: number) =>
            vscode.l10n.t({
                message: "{0} files changed",
                args: [fileCount],
                comment: ["Description showing the number of changed files. 'files' is plural."]
            }),
        /**
         * Returns the site label with file count (singular: "1 file")
         */
        SITE_WITH_FILE_COUNT_SINGULAR: (siteName: string, fileCount: number) =>
            vscode.l10n.t({
                message: "{0} ({1} file)",
                args: [siteName, fileCount],
                comment: ["This is the site label showing the number of changed files. 'file' is singular."]
            }),
        /**
         * Returns the site label with file count (plural: "X files")
         */
        SITE_WITH_FILE_COUNT_PLURAL: (siteName: string, fileCount: number) =>
            vscode.l10n.t({
                message: "{0} ({1} files)",
                args: [siteName, fileCount],
                comment: ["This is the site label showing the number of changed files. 'files' is plural."]
            }),
        /**
         * Returns the confirmation message for discarding local changes
         */
        DISCARD_LOCAL_CHANGES_CONFIRM: (relativePath: string) =>
            vscode.l10n.t({
                message: "Are you sure you want to discard local changes to '{0}'? This action cannot be undone.",
                args: [relativePath],
                comment: ["Confirmation message before discarding local changes to a file."]
            }),
        /**
         * Returns the success message after discarding local changes
         */
        DISCARD_LOCAL_CHANGES_SUCCESS: (relativePath: string) =>
            vscode.l10n.t({
                message: "Successfully discarded local changes to '{0}'.",
                args: [relativePath],
                comment: ["Success message after discarding local changes to a file."]
            }),
        /**
         * Returns the error message when discarding local changes fails
         */
        DISCARD_LOCAL_CHANGES_FAILED: (errorMessage: string) =>
            vscode.l10n.t({
                message: "Failed to discard local changes: {0}",
                args: [errorMessage],
                comment: ["Error message when discarding local changes fails."]
            }),
        /**
         * Returns the confirmation message for discarding all local changes in a folder
         */
        DISCARD_FOLDER_CHANGES_CONFIRM: (folderName: string, fileCount: number) =>
            vscode.l10n.t({
                message: "Are you sure you want to discard local changes to all {0} files in '{1}'? This action cannot be undone.",
                args: [fileCount, folderName],
                comment: ["Confirmation message before discarding all local changes in a folder."]
            }),
        /**
         * Returns the success message after discarding all local changes in a folder
         */
        DISCARD_FOLDER_CHANGES_SUCCESS: (folderName: string, fileCount: number) =>
            vscode.l10n.t({
                message: "Successfully discarded local changes to {0} files in '{1}'.",
                args: [fileCount, folderName],
                comment: ["Success message after discarding all local changes in a folder."]
            }),
        /**
         * Returns the title for comparing all files in a site
         */
        COMPARE_ALL_TITLE: (siteName: string) =>
            vscode.l10n.t({
                message: "Compare: {0} (Remote ↔ Local)",
                args: [siteName],
                comment: ["Title for the multi-diff editor when comparing all files in a site."]
            }),
        /**
         * Returns the title for comparing a single file
         */
        COMPARE_FILE_TITLE: (siteName: string, relativePath: string) =>
            vscode.l10n.t({
                message: "{0}: {1} (Remote ↔ Local)",
                args: [siteName, relativePath],
                comment: ["Title for the diff editor when comparing a single file."]
            }),
        /**
         * Returns the message for skipped binary files
         */
        METADATA_DIFF_BINARY_FILES_SKIPPED: (count: number) =>
            vscode.l10n.t({
                message: "{0} binary file(s) (e.g., images) were skipped as they cannot be displayed in the diff viewer. You can view them individually in the file tree.",
                args: [count],
                comment: ["Message shown when binary files are skipped in the multi-diff view."]
            }),
        /**
         * Returns the success message when HTML report is saved
         */
        HTML_REPORT_SAVED_SUCCESS: (filePath: string) =>
            vscode.l10n.t({
                message: "HTML report saved successfully to '{0}'.",
                args: [filePath],
                comment: ["Success message when HTML report is saved. {0} is the file path."]
            }),
        /**
         * Returns the error message when HTML report generation fails
         */
        HTML_REPORT_GENERATION_FAILED: (errorMessage: string) =>
            vscode.l10n.t({
                message: "Failed to generate HTML report: {0}",
                args: [errorMessage],
                comment: ["Error message when HTML report generation fails. {0} is the error message."]
            }),
        /**
         * Returns the description for imported comparison showing file count and export date
         */
        IMPORTED_COMPARISON_DESCRIPTION: (fileCount: number, formattedDate: string) =>
            vscode.l10n.t({
                message: "{0} files changed (Imported {1})",
                args: [fileCount, formattedDate],
                comment: ["Description for imported comparison. {0} is file count, {1} is formatted date."]
            }),
        /**
         * Returns the error message when a required field is missing in import
         */
        METADATA_DIFF_MISSING_REQUIRED_FIELD: (fieldName: string) =>
            vscode.l10n.t({
                message: "Missing required field: {0}",
                args: [fieldName],
                comment: ["Error when importing a file that is missing a required field."]
            }),
        /**
         * Returns the success message when export is complete
         */
        METADATA_DIFF_EXPORT_SUCCESS: (filePath: string) =>
            vscode.l10n.t({
                message: "Comparison exported successfully to '{0}'.",
                args: [filePath],
                comment: ["Success message when export is saved. {0} is the file path."]
            }),
        /**
         * Returns the error message when export fails
         */
        METADATA_DIFF_EXPORT_FAILED: (errorMessage: string) =>
            vscode.l10n.t({
                message: "Failed to export comparison: {0}",
                args: [errorMessage],
                comment: ["Error message when export fails. {0} is the error message."]
            }),
        /**
         * Returns the success message when import is complete
         */
        METADATA_DIFF_IMPORT_SUCCESS: (siteName: string) =>
            vscode.l10n.t({
                message: "Comparison for '{0}' imported successfully.",
                args: [siteName],
                comment: ["Success message when import is complete. {0} is the site name."]
            }),
        /**
         * Returns the error message when import fails
         */
        METADATA_DIFF_IMPORT_FAILED: (errorMessage: string) =>
            vscode.l10n.t({
                message: "Failed to import comparison: {0}",
                args: [errorMessage],
                comment: ["Error message when import fails. {0} is the error message."]
            }),
        /**
         * Returns the progress message when resyncing a site comparison
         */
        RESYNCING_SITE_COMPARISON: (siteName: string) =>
            vscode.l10n.t({
                message: "Refreshing comparison for {0} ([details](command:microsoft.powerplatform.pages.actionsHub.showOutputChannel \"Show download output\"))...",
                args: [siteName],
                comment: ["This is a markdown formatting which must persist across translations."]
            }),
    },
    EventNames: {
        ACTIONS_HUB_ENABLED: "ActionsHubEnabled",
        ACTIONS_HUB_INITIALIZED: "ActionsHubInitialized",
        ACTIONS_HUB_INITIALIZATION_FAILED: "ActionsHubInitializationFailed",
        ACTIONS_HUB_REFRESH_FAILED: "ActionsHubRefreshFailed",
        ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_FAILED: "ActionsHubShowEnvironmentDetailsFailed",
        SITE_MANAGEMENT_URL_NOT_FOUND: "SiteManagementUrlNotFound",
        ACTIONS_HUB_UPLOAD_OTHER_SITE: "ActionsHubUploadOtherSite",
        ACTIONS_HUB_REFRESH: "ActionsHubRefresh",
        ACTIONS_HUB_LOAD_WEBSITES_FAILED: "ActionsHubLoadWebsitesFailed",
        ACTIONS_HUB_TREE_GET_CHILDREN_CALLED: "ActionsHubTreeGetChildrenCalled",
        ACTIONS_HUB_TREE_GET_CHILDREN_FAILED: "ActionsHubTreeGetChildrenFailed",
        ACTIONS_HUB_REFRESH_ENVIRONMENT_CALLED: "ActionsHubRefreshEnvironmentCalled",
        ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_CALLED: "ActionsHubShowEnvironmentDetailsCalled",
        ACTIONS_HUB_SWITCH_ENVIRONMENT_CALLED: "ActionsHubSwitchEnvironmentCalled",
        ACTIONS_HUB_SWITCH_ENVIRONMENT_CANCELLED: "ActionsHubSwitchEnvironmentCancelled",
        ACTIONS_HUB_SWITCH_ENVIRONMENT_FAILED: "ActionsHubSwitchEnvironmentFailed",
        ACTIONS_HUB_OPEN_ACTIVE_SITES_IN_STUDIO_CALLED: "ActionsHubOpenActiveSitesInStudioCalled",
        ACTIONS_HUB_OPEN_ACTIVE_SITES_IN_STUDIO_FAILED: "ActionsHubOpenActiveSitesInStudioFailed",
        ACTIONS_HUB_OPEN_INACTIVE_SITES_IN_STUDIO_CALLED: "ActionsHubOpenInactiveSitesInStudioCalled",
        ACTIONS_HUB_OPEN_INACTIVE_SITES_IN_STUDIO_FAILED: "ActionsHubOpenInactiveSitesInStudioFailed",
        ACTIONS_HUB_PREVIEW_SITE_CALLED: "ActionsHubPreviewSiteCalled",
        ACTIONS_HUB_PREVIEW_SITE_FAILED: "ActionsHubPreviewSiteFailed",
        ACTIONS_HUB_CREATE_AUTH_PROFILE_CALLED: "ActionsHubCreateAuthProfileCalled",
        ACTIONS_HUB_CREATE_AUTH_PROFILE_FAILED: "ActionsHubCreateAuthProfileFailed",
        ACTIONS_HUB_FETCH_WEBSITES_CALLED: "ActionsHubFetchWebsitesCalled",
        ACTIONS_HUB_FETCH_WEBSITES_FAILED: "ActionsHubFetchWebsitesFailed",
        ACTIONS_HUB_REVEAL_IN_OS_CALLED: "ActionsHubRevealInOSCalled",
        ACTIONS_HUB_REVEAL_IN_OS_SUCCESSFUL: "ActionsHubRevealInOSSuccessful",
        ACTIONS_HUB_REVEAL_IN_OS_FAILED: "ActionsHubRevealInOSFailed",
        ACTIONS_HUB_OPEN_SITE_MANAGEMENT_CALLED: "ActionsHubOpenSiteManagementCalled",
        ACTIONS_HUB_OPEN_SITE_MANAGEMENT_SUCCESSFUL: "ActionsHubOpenSiteManagementSuccessful",
        ACTIONS_HUB_OPEN_SITE_MANAGEMENT_FAILED: "ActionsHubOpenSiteManagementFailed",
        ACTIONS_HUB_UPLOAD_SITE_CALLED: "ActionsHubUploadSiteCalled",
        ACTIONS_HUB_UPLOAD_SITE_FAILED: "ActionsHubUploadSiteFailed",
        ACTIONS_HUB_UPLOAD_OTHER_SITE_CALLED: "ActionsHubUploadOtherSiteCalled",
        ACTIONS_HUB_UPLOAD_OTHER_SITE_PAC_TRIGGERED: "ActionsHubUploadOtherSitePacTriggered",
        ACTIONS_HUB_UPLOAD_CURRENT_SITE_CALLED: "ActionsHubUploadCurrentSiteCalled",
        ACTIONS_HUB_UPLOAD_CURRENT_SITE_CANCELLED_PUBLIC_SITE: "ActionsHubUploadCurrentSiteCancelled",
        ACTIONS_HUB_UPLOAD_CURRENT_SITE_PAC_TRIGGERED: "ActionsHubUploadCurrentSitePacTriggered",
        ACTIONS_HUB_FIND_OTHER_SITES_CALLED: "ActionsHubFindOtherSitesCalled",
        ACTIONS_HUB_FIND_OTHER_SITES_FAILED: "ActionsHubFindOtherSitesFailed",
        ACTIONS_HUB_FIND_OTHER_SITES_YAML_PARSE_FAILED: "ActionsHubFindOtherSitesYamlParseFailed",
        ACTIONS_HUB_SHOW_SITE_DETAILS_CALLED: "ActionsHubShowSiteDetailsCalled",
        ACTIONS_HUB_SHOW_SITE_DETAILS_FAILED: "ActionsHubShowSiteDetailsFailed",
        ACTIONS_HUB_SHOW_SITE_DETAILS_COPY_TO_CLIPBOARD: "ActionsHubShowSiteDetailsCopyToClipboard",
        ACTIONS_HUB_DOWNLOAD_SITE_CALLED: "ActionsHubDownloadSiteCalled",
        ACTIONS_HUB_DOWNLOAD_SITE_FAILED: "ActionsHubDownloadSiteFailed",
        ACTIONS_HUB_DOWNLOAD_SITE_PAC_TRIGGERED: "ActionsHubDownloadSitePacTriggered",
        ACTIONS_HUB_DOWNLOAD_CODE_SITE_PAC_TRIGGERED: "ActionsHubDownloadCodeSitePacTriggered",
        ACTIONS_HUB_OPEN_SITE_IN_STUDIO_CALLED: "ActionsHubOpenSiteInStudioCalled",
        ACTIONS_HUB_OPEN_SITE_IN_STUDIO_FAILED: "ActionsHubOpenSiteInStudioFailed",
        ACTIONS_HUB_SITE_REACTIVATION_FAILED: "ActionsHubSiteReactivationFailed",
        ACTIONS_HUB_UPLOAD_CODE_SITE_CALLED: "ActionsHubUploadCodeSiteCalled",
        ACTIONS_HUB_UPLOAD_CODE_SITE_FAILED: "ActionsHubUploadCodeSiteFailed",
        ACTIONS_HUB_UPLOAD_OTHER_CODE_SITE_PAC_TRIGGERED: "ActionsHubUploadOtherCodeSitePacTriggered",
        POWER_PAGES_CONFIG_PARSE_FAILED: "PowerPagesConfigParseFailed",
        ACTIONS_HUB_CODEQL_SCREENING_STARTED: "ActionsHubCodeQLScreeningStarted",
        ACTIONS_HUB_CODEQL_SCREENING_COMPLETED: "ActionsHubCodeQLScreeningCompleted",
        ACTIONS_HUB_CODEQL_SCREENING_FAILED: "ActionsHubCodeQLScreeningFailed",
        ACTIONS_HUB_CODEQL_EXTENSION_SEARCH_STARTED: "ActionsHubCodeQLExtensionSearchStarted",
        ACTIONS_HUB_CODEQL_EXTENSION_FOUND: "ActionsHubCodeQLExtensionFound",
        ACTIONS_HUB_CODEQL_EXTENSION_NOT_FOUND: "ActionsHubCodeQLExtensionNotFound",
        ACTIONS_HUB_CODEQL_EXTENSION_INSTALL_PROMPTED: "ActionsHubCodeQLExtensionInstallPrompted",
        ACTIONS_HUB_CODEQL_EXTENSION_INSTALL_ACCEPTED: "ActionsHubCodeQLExtensionInstallAccepted",
        ACTIONS_HUB_CODEQL_EXTENSION_INSTALL_DECLINED: "ActionsHubCodeQLExtensionInstallDeclined",
        ACTIONS_HUB_CODEQL_SCREENING_DATABASE_CREATED: "ActionsHubCodeQLScreeningDatabaseCreated",
        ACTIONS_HUB_CODEQL_SCREENING_NOT_SUPPORTED: "ActionsHubCodeQLScreeningNotSupported",
        // CodeQL Action specific events
        ACTIONS_HUB_CODEQL_ACTION_STARTED: "ActionsHubCodeQLActionStarted",
        ACTIONS_HUB_CODEQL_ACTION_COMPLETED: "ActionsHubCodeQLActionCompleted",
        ACTIONS_HUB_CODEQL_ACTION_FAILED: "ActionsHubCodeQLActionFailed",
        ACTIONS_HUB_CODEQL_CLI_SEARCH_STARTED: "ActionsHubCodeQLCliSearchStarted",
        ACTIONS_HUB_CODEQL_CLI_FOUND: "ActionsHubCodeQLCliFound",
        ACTIONS_HUB_CODEQL_CLI_NOT_FOUND: "ActionsHubCodeQLCliNotFound",
        ACTIONS_HUB_CODEQL_EXTENSION_ACTIVATION_STARTED: "ActionsHubCodeQLExtensionActivationStarted",
        ACTIONS_HUB_CODEQL_EXTENSION_ACTIVATION_COMPLETED: "ActionsHubCodeQLExtensionActivationCompleted",
        ACTIONS_HUB_CODEQL_EXTENSION_ACTIVATION_FAILED: "ActionsHubCodeQLExtensionActivationFailed",
        ACTIONS_HUB_CODEQL_DATABASE_CREATION_STARTED: "ActionsHubCodeQLDatabaseCreationStarted",
        ACTIONS_HUB_CODEQL_DATABASE_CREATION_COMPLETED: "ActionsHubCodeQLDatabaseCreationCompleted",
        ACTIONS_HUB_CODEQL_DATABASE_CREATION_FAILED: "ActionsHubCodeQLDatabaseCreationFailed",
        ACTIONS_HUB_CODEQL_ANALYSIS_STARTED: "ActionsHubCodeQLAnalysisStarted",
        ACTIONS_HUB_CODEQL_ANALYSIS_COMPLETED: "ActionsHubCodeQLAnalysisCompleted",
        ACTIONS_HUB_CODEQL_ANALYSIS_FAILED: "ActionsHubCodeQLAnalysisFailed",
        ACTIONS_HUB_CODEQL_CONFIG_FILE_READ: "ActionsHubCodeQLConfigFileRead",
        ACTIONS_HUB_CODEQL_CONFIG_FILE_CREATED: "ActionsHubCodeQLConfigFileCreated",
        ACTIONS_HUB_CODEQL_CONFIG_FILE_UPDATED: "ActionsHubCodeQLConfigFileUpdated",
        ACTIONS_HUB_CODEQL_CONFIG_FILE_ERROR: "ActionsHubCodeQLConfigFileError",
        ACTIONS_HUB_CODEQL_RESULTS_PROCESSED: "ActionsHubCodeQLResultsProcessed",
        ACTIONS_HUB_CODEQL_RESULTS_DISPLAY_FAILED: "ActionsHubCodeQLResultsDisplayFailed",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_OPENED: "ActionsHubCodeQLSarifViewerOpened",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_NOT_FOUND: "ActionsHubCodeQLSarifViewerNotFound",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_ACTIVATION_STARTED: "ActionsHubCodeQLSarifViewerActivationStarted",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_ACTIVATION_COMPLETED: "ActionsHubCodeQLSarifViewerActivationCompleted",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_NOT_AVAILABLE: "ActionsHubCodeQLSarifViewerNotAvailable",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_PROMPTED: "ActionsHubCodeQLSarifViewerInstallPrompted",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_ACCEPTED: "ActionsHubCodeQLSarifViewerInstallAccepted",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_DECLINED: "ActionsHubCodeQLSarifViewerInstallDeclined",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_SUCCESS: "ActionsHubCodeQLSarifViewerInstallSuccess",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_FAILED: "ActionsHubCodeQLSarifViewerInstallFailed",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_API_ERROR: "ActionsHubCodeQLSarifViewerApiError",
        ACTIONS_HUB_CODEQL_SARIF_VIEWER_OPENING_WITH_ISSUES: "ActionsHubCodeQLSarifViewerOpeningWithIssues",
        ACTIONS_HUB_CODEQL_ANALYSIS_CLEAN_RESULTS: "ActionsHubCodeQLAnalysisCleanResults",
        ACTIONS_HUB_CODEQL_FALLBACK_TO_TEXT_EDITOR: "ActionsHubCodeQLFallbackToTextEditor",
        ACTIONS_HUB_ACCOUNT_MISMATCH_DETECTED: "ActionsHubAccountMismatchDetected",
        ACTIONS_HUB_LOGIN_TO_MATCH_CALLED: "ActionsHubLoginToMatchCalled",
        ACTIONS_HUB_LOGIN_TO_MATCH_FAILED: "ActionsHubLoginToMatchFailed",
        ACTIONS_HUB_LOGIN_TO_MATCH_SUCCEEDED: "ActionsHubLoginToMatchSucceeded",
        ACTIONS_HUB_LOGIN_TO_MATCH_CANCELLED: "ActionsHubLoginToMatchCancelled",
        ACTIONS_HUB_ACCOUNT_CHECK_CALLED: "ActionsHubAccountCheckCalled",
        ACTIONS_HUB_ACCOUNT_CHECK_FAILED: "ActionsHubAccountCheckFailed",
        ACTIONS_HUB_ACCOUNT_MISMATCH_UI_SHOWN: "ActionsHubAccountMismatchUIShown",
        ACTIONS_HUB_ACCOUNT_MATCH_RESOLVED: "ActionsHubAccountMatchResolved",
        ACTIONS_HUB_LOGIN_PROMPT_CLICKED: "ActionsHubLoginPromptClicked",
        ACTIONS_HUB_REACTIVATE_SITE_CALLED: "ActionsHubReactivateSiteCalled",
        ACTIONS_HUB_COMPARE_WITH_LOCAL_CALLED: "ActionsHubCompareWithLocalCalled",
        ACTIONS_HUB_COMPARE_WITH_LOCAL_NO_WORKSPACE: "ActionsHubCompareWithLocalNoWorkspace",
        ACTIONS_HUB_COMPARE_WITH_LOCAL_WEBSITE_ID_NOT_FOUND: "ActionsHubCompareWithLocalWebsiteIdNotFound",
        ACTIONS_HUB_COMPARE_WITH_LOCAL_DOWNLOAD_FAILED: "ActionsHubCompareWithLocalDownloadFailed",
        ACTIONS_HUB_COMPARE_WITH_LOCAL_COMPLETED: "ActionsHubCompareWithLocalCompleted",
        ACTIONS_HUB_COMPARE_WITH_LOCAL_NO_DIFFERENCES: "ActionsHubCompareWithLocalNoDifferences",
        ACTIONS_HUB_METADATA_DIFF_OPEN_FILE: "ActionsHubMetadataDiffOpenFile",
        ACTIONS_HUB_METADATA_DIFF_OPEN_ALL: "ActionsHubMetadataDiffOpenAll",
        ACTIONS_HUB_METADATA_DIFF_CLEAR: "ActionsHubMetadataDiffClear",
        ACTIONS_HUB_METADATA_DIFF_DISCARD_FILE: "ActionsHubMetadataDiffDiscardFile",
        ACTIONS_HUB_METADATA_DIFF_DISCARD_FOLDER: "ActionsHubMetadataDiffDiscardFolder",
        ACTIONS_HUB_METADATA_DIFF_VIEW_MODE_CHANGED: "ActionsHubMetadataDiffViewModeChanged",
        ACTIONS_HUB_METADATA_DIFF_SORT_MODE_CHANGED: "ActionsHubMetadataDiffSortModeChanged",
        ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CALLED: "ActionsHubCompareWithEnvironmentCalled",
        ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_ENVIRONMENT_SELECTED: "ActionsHubCompareWithEnvironmentEnvironmentSelected",
        ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_WEBSITE_SELECTED: "ActionsHubCompareWithEnvironmentWebsiteSelected",
        ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CANCELLED: "ActionsHubCompareWithEnvironmentCancelled",
        ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_WEBSITE_NOT_FOUND: "ActionsHubCompareWithEnvironmentWebsiteNotFound",
        ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_COMPLETED: "ActionsHubCompareWithEnvironmentCompleted",
        ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_FAILED: "ActionsHubCompareWithEnvironmentFailed",
        ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_NO_DIFFERENCES: "ActionsHubCompareWithEnvironmentNoDifferences",
        ACTIONS_HUB_METADATA_DIFF_SITE_DOWNLOAD_COMPLETED: "ActionsHubMetadataDiffSiteDownloadCompleted",
        ACTIONS_HUB_METADATA_DIFF_GENERATE_HTML_REPORT_CALLED: "ActionsHubMetadataDiffGenerateHtmlReportCalled",
        ACTIONS_HUB_METADATA_DIFF_HTML_REPORT_SAVED: "ActionsHubMetadataDiffHtmlReportSaved",
        ACTIONS_HUB_METADATA_DIFF_HTML_REPORT_FAILED: "ActionsHubMetadataDiffHtmlReportFailed",
        ACTIONS_HUB_METADATA_DIFF_EXPORT_CALLED: "ActionsHubMetadataDiffExportCalled",
        ACTIONS_HUB_METADATA_DIFF_EXPORT_CANCELLED: "ActionsHubMetadataDiffExportCancelled",
        ACTIONS_HUB_METADATA_DIFF_EXPORT_SUCCESS: "ActionsHubMetadataDiffExportSuccess",
        ACTIONS_HUB_METADATA_DIFF_EXPORT_FAILED: "ActionsHubMetadataDiffExportFailed",
        ACTIONS_HUB_METADATA_DIFF_IMPORT_CALLED: "ActionsHubMetadataDiffImportCalled",
        ACTIONS_HUB_METADATA_DIFF_IMPORT_SUCCESS: "ActionsHubMetadataDiffImportSuccess",
        ACTIONS_HUB_METADATA_DIFF_IMPORT_FAILED: "ActionsHubMetadataDiffImportFailed",
        ACTIONS_HUB_METADATA_DIFF_RESYNC_CALLED: "ActionsHubMetadataDiffResyncCalled",
        ACTIONS_HUB_METADATA_DIFF_RESYNC_COMPLETED: "ActionsHubMetadataDiffResyncCompleted",
        ACTIONS_HUB_METADATA_DIFF_RESYNC_FAILED: "ActionsHubMetadataDiffResyncFailed",
        ACTIONS_HUB_METADATA_DIFF_RESYNC_NO_DIFFERENCES: "ActionsHubMetadataDiffResyncNoDifferences",
    },
    StudioEndpoints: {
        TEST: "https://make.test.powerpages.microsoft.com",
        PREPROD: "https://make.preprod.powerpages.microsoft.com",
        PROD: "https://make.powerpages.microsoft.com",
        DOD: "https://make.powerpages.microsoft.appsplatform.us",
        GCC: "https://make.gov.powerpages.microsoft.us",
        HIGH: "https://make.high.powerpages.microsoft.us",
        MOONCAKE: "https://make.powerpages.microsoft.cn"
    },
    AppNames: {
        POWER_PAGES_MANAGEMENT: 'mspp_powerpagemanagement',
        PORTAL_MANAGEMENT: 'dynamics365portals'
    },
    EntityNames: {
        MSPP_WEBSITE: 'mspp_website',
        ADX_WEBSITE: 'adx_website'
    }
};
