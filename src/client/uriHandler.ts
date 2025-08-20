/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "./pac/PacWrapper";
import { oneDSLoggerWrapper } from "../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { desktopTelemetryEventNames } from "../common/OneDSLoggerTelemetry/client/desktopExtensionTelemetryEventNames";

// Constants for URI handler
const URI_CONSTANTS = {
    EXTENSION_ID: 'microsoft-IsvExpTools.powerplatform-vscode',
    PATHS: {
        PCF_INIT: '/pcfInit',
        OPEN: '/open'
    },
    PARAMETERS: {
        WEBSITE_ID: 'websiteid',
        ENV_ID: 'envid',
        ORG_URL: 'orgurl',
        SCHEMA: 'schema',
        SITE_NAME: 'sitename'
    },
    SCHEMA_VALUES: {
        PORTAL_SCHEMA_V2: 'portalschemav2'
    },
    MODEL_VERSIONS: {
        VERSION_1: 1,
        VERSION_2: 2
    },
    TIMEOUTS: {
        COMPLETION_DIALOG: 30000 // 30 seconds
    }
} as const;

// Localized string constants
const STRINGS = {
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

export function RegisterUriHandler(pacWrapper: PacWrapper): vscode.Disposable {
    const uriHandler = new UriHandler(pacWrapper);
    return vscode.window.registerUriHandler(uriHandler);
}

const enum UriPath {
    PcfInit = '/pcfInit',
    Open = '/open',
}

class UriHandler implements vscode.UriHandler {
    private readonly pacWrapper: PacWrapper;

    constructor(pacWrapper: PacWrapper) {
        this.pacWrapper = pacWrapper;
    }

    // URIs targeting our extension are in the format
    // vscode://<ExtensionName>/<PathArgs>?<QueryArgs>#<FragmentArgs>
    // vscode://microsoft-IsvExpTools.powerplatform-vscode/pcfInit
    // vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=xxx&envid=yyy&orgurl=zzz&schema=PortalSchemaV2
    public async handleUri(uri: vscode.Uri): Promise<void> {
        if (uri.path === UriPath.PcfInit) {
            return this.pcfInit();
        } else if (uri.path === UriPath.Open) {
            return this.handleOpenPowerPages(uri);
        }
    }

    async pcfInit(): Promise<void> {
        const pcfInitLabel = vscode.l10n.t({
            message: "Select Folder for new PCF Control",
            comment: ["Do not translate 'PCF' as it is a product name."]
        });

        const openResults = await vscode.window.showOpenDialog({
            canSelectFiles: false, canSelectFolders: true, canSelectMany: false, openLabel: pcfInitLabel });

        if (openResults && openResults.length === 1) {
            const selectedFolder = openResults[0]; // TODO - Consider checking if folder is empty

            const terminal = vscode.window.createTerminal({
                name: "PAC CLI",
                cwd: selectedFolder.fsPath,
                isTransient: true,
            });

            terminal.show();
            terminal.sendText("pac pcf init");

            // Open new workspace folder, if destination was not in existing workspace
            if(vscode.workspace.getWorkspaceFolder(selectedFolder) === undefined) {
                vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length ?? 0, 0, { uri: selectedFolder });
            }
        }
    }

    async handleOpenPowerPages(uri: vscode.Uri): Promise<void> {
        const startTime = Date.now();
        let telemetryData: Record<string, string> = {};

        try {
            // Parse query parameters from the URI
            const urlParams = new URLSearchParams(uri.query);

            // Extract required parameters
            const websiteId = urlParams.get(URI_CONSTANTS.PARAMETERS.WEBSITE_ID);
            const environmentId = urlParams.get(URI_CONSTANTS.PARAMETERS.ENV_ID);
            const orgUrl = urlParams.get(URI_CONSTANTS.PARAMETERS.ORG_URL);
            const schema = urlParams.get(URI_CONSTANTS.PARAMETERS.SCHEMA);
            const siteName = urlParams.get(URI_CONSTANTS.PARAMETERS.SITE_NAME);

            // Populate telemetry data
            telemetryData = {
                websiteId: websiteId || 'missing',
                environmentId: environmentId || 'missing',
                orgUrl: orgUrl ? 'provided' : 'missing', // Don't log actual URL for privacy
                schema: schema || 'none',
                siteName: siteName ? 'provided' : 'missing',
                uriQuery: uri.query || 'empty'
            };

            oneDSLoggerWrapper.getLogger().traceInfo(
                desktopTelemetryEventNames.DESKTOP_URI_HANDLER_OPEN_POWER_PAGES_TRIGGERED,
                telemetryData
            );

            // Validate required parameters
            if (!websiteId) {
                vscode.window.showErrorMessage(vscode.l10n.t(STRINGS.ERRORS.WEBSITE_ID_REQUIRED));
                oneDSLoggerWrapper.getLogger().traceError(
                    desktopTelemetryEventNames.DESKTOP_URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    'Missing website ID',
                    new Error('Website ID parameter is required but not provided'),
                    { ...telemetryData, error: 'missing_website_id' }
                );
                return;
            }

            if (!environmentId) {
                vscode.window.showErrorMessage(vscode.l10n.t(STRINGS.ERRORS.ENVIRONMENT_ID_REQUIRED));
                oneDSLoggerWrapper.getLogger().traceError(
                    desktopTelemetryEventNames.DESKTOP_URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    'Missing environment ID',
                    new Error('Environment ID parameter is required but not provided'),
                    { ...telemetryData, error: 'missing_environment_id' }
                );
                return;
            }

            if (!orgUrl) {
                vscode.window.showErrorMessage(vscode.l10n.t(STRINGS.ERRORS.ORG_URL_REQUIRED));
                oneDSLoggerWrapper.getLogger().traceError(
                    desktopTelemetryEventNames.DESKTOP_URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    'Missing organization URL',
                    new Error('Organization URL parameter is required but not provided'),
                    { ...telemetryData, error: 'missing_org_url' }
                );
                return;
            }

            // Determine model version based on schema parameter
            // If schema is "PortalSchemaV2" (case-insensitive), use model version 2, otherwise use 1
            const modelVersion = schema && schema.toLowerCase() === URI_CONSTANTS.SCHEMA_VALUES.PORTAL_SCHEMA_V2
                ? URI_CONSTANTS.MODEL_VERSIONS.VERSION_2
                : URI_CONSTANTS.MODEL_VERSIONS.VERSION_1;

            telemetryData.modelVersion = modelVersion.toString();

            // Check if user is authenticated with PAC CLI
            const authInfo = await this.pacWrapper.activeOrg();

            if (!authInfo || authInfo.Status !== "Success") {
                const authRequired = await vscode.window.showWarningMessage(
                    vscode.l10n.t("You need to authenticate with Power Platform to download the site. Would you like to authenticate now?"),
                    { modal: true },
                    vscode.l10n.t("Yes"),
                    vscode.l10n.t("No")
                );

                if (authRequired === vscode.l10n.t("Yes")) {
                    // Trigger authentication
                    await this.pacWrapper.authCreateNewAuthProfileForOrg(orgUrl);

                    // Check authentication again
                    const newAuthInfo = await this.pacWrapper.activeOrg();
                    if (!newAuthInfo || newAuthInfo.Status !== "Success") {
                        vscode.window.showErrorMessage(vscode.l10n.t("Authentication failed. Cannot proceed with site download."));
                        return;
                    }
                } else {
                    vscode.window.showInformationMessage(vscode.l10n.t("Site download cancelled. Authentication is required to proceed."));
                    return;
                }
            }

            // Check if the current environment matches the requested one
            const currentAuthInfo = await this.pacWrapper.activeOrg();
            if (currentAuthInfo?.Status === "Success" && currentAuthInfo.Results?.EnvironmentId !== environmentId) {
                const switchEnv = await vscode.window.showWarningMessage(
                    vscode.l10n.t("You are currently connected to a different environment. Would you like to switch to the required environment?"),
                    { modal: true },
                    vscode.l10n.t("Yes"),
                    vscode.l10n.t("No")
                );

                if (switchEnv === vscode.l10n.t("Yes")) {
                    try {
                        // Switch to the correct environment
                        await this.pacWrapper.orgSelect(orgUrl);

                        // Verify the switch was successful
                        const verifyAuthInfo = await this.pacWrapper.activeOrg();
                        if (verifyAuthInfo?.Status !== "Success" || verifyAuthInfo.Results?.EnvironmentId !== environmentId) {
                            vscode.window.showErrorMessage(vscode.l10n.t("Failed to switch to the required environment."));
                            return;
                        }
                    } catch (error) {
                        vscode.window.showErrorMessage(vscode.l10n.t("Error switching environment: {0}", error instanceof Error ? error.message : String(error)));
                        return;
                    }
                } else {
                    vscode.window.showInformationMessage(vscode.l10n.t("Site download cancelled. Correct environment connection is required."));
                    return;
                }
            }

            // Prompt user to select download folder
            const downloadLabel = vscode.l10n.t("Select Folder to Download Power Pages Site");
            const downloadResults = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: downloadLabel,
                title: vscode.l10n.t("Download Power Pages Site")
            });

            if (!downloadResults || downloadResults.length === 0) {
                vscode.window.showInformationMessage(vscode.l10n.t("Site download cancelled. No folder selected."));
                return;
            }

            const selectedFolder = downloadResults[0];

            // Execute the pac pages download command using terminal
            try {
                // Execute the pac pages download command with the appropriate model version
                const downloadCommand = `pac pages download --path "${selectedFolder.fsPath}" --websiteId "${websiteId}" --modelVersion ${modelVersion}`;

                const terminal = vscode.window.createTerminal({
                    name: "Power Pages Download",
                    cwd: selectedFolder.fsPath,
                    isTransient: false,
                });

                terminal.show();
                terminal.sendText(downloadCommand);

                // Show completion message after a delay
                setTimeout(async () => {
                    const openFolder = await vscode.window.showInformationMessage(
                        vscode.l10n.t("Power Pages site download should be complete. Would you like to open the downloaded site folder?"),
                        vscode.l10n.t("Open Folder"),
                        vscode.l10n.t("Open in New Workspace"),
                        vscode.l10n.t("Not Now")
                    );

                    if (openFolder === vscode.l10n.t("Open Folder")) {
                        // Open the folder in current workspace
                        await vscode.commands.executeCommand('vscode.openFolder', selectedFolder, false);
                    } else if (openFolder === vscode.l10n.t("Open in New Workspace")) {
                        // Open the downloaded folder in a new workspace
                        await vscode.commands.executeCommand('vscode.openFolder', selectedFolder, true);
                    }
                }, 20000); // Wait 20 seconds before showing completion dialog

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(vscode.l10n.t("Failed to download site: {0}", errorMessage));
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(vscode.l10n.t("Failed to handle Power Pages URI: {0}", errorMessage));
        }
    }

    /**
     * Validates if the downloaded folder exists and is accessible
     */
    private async validateDownloadedFolder(folderPath: string): Promise<boolean> {
        try {
            const stat = await vscode.workspace.fs.stat(vscode.Uri.file(folderPath));
            return stat.type === vscode.FileType.Directory;
        } catch {
            return false;
        }
    }

    /**
     * Checks if PAC CLI is available and functional
     */
    private async validatePacCli(): Promise<{ isAvailable: boolean; error?: string }> {
        try {
            const authResult = await this.pacWrapper.activeAuth();
            return {
                isAvailable: authResult?.Status === "Success" || authResult?.Status === "AuthRequired"
            };
        } catch (error) {
            return {
                isAvailable: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
