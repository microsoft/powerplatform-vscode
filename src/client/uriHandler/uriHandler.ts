/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../pac/PacWrapper";
import { oneDSLoggerWrapper } from "../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { URI_CONSTANTS, UriPath } from "./constants/uriConstants";
import { URI_HANDLER_STRINGS } from "./constants/uriStrings";
import { uriHandlerTelemetryEventNames } from "./telemetry/uriHandlerTelemetryEvents";

export function RegisterUriHandler(pacWrapper: PacWrapper): vscode.Disposable {
    const uriHandler = new UriHandler(pacWrapper);
    return vscode.window.registerUriHandler(uriHandler);
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
        const startTime = Date.now();

        try {
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_PCF_INIT_TRIGGERED,
                { timestamp: startTime.toString() }
            );

            const pcfInitLabel = vscode.l10n.t({
                message: URI_HANDLER_STRINGS.TITLES.PCF_INIT,
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

                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_PCF_INIT_TRIGGERED,
                    {
                        success: 'true',
                        folderPath: 'provided',
                        duration: (Date.now() - startTime).toString()
                    }
                );
            }
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_PCF_INIT_TRIGGERED,
                'PCF Init failed',
                error instanceof Error ? error : new Error(String(error)),
                { duration: (Date.now() - startTime).toString() }
            );
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
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_TRIGGERED,
                telemetryData
            );

            // Validate required parameters
            if (!websiteId) {
                vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.WEBSITE_ID_REQUIRED));
                oneDSLoggerWrapper.getLogger().traceError(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    'Missing website ID',
                    new Error('Website ID parameter is required but not provided'),
                    { ...telemetryData, error: 'missing_website_id' }
                );
                return;
            }

            if (!environmentId) {
                vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.ENVIRONMENT_ID_REQUIRED));
                oneDSLoggerWrapper.getLogger().traceError(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    'Missing environment ID',
                    new Error('Environment ID parameter is required but not provided'),
                    { ...telemetryData, error: 'missing_environment_id' }
                );
                return;
            }

            if (!orgUrl) {
                vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.ORG_URL_REQUIRED));
                oneDSLoggerWrapper.getLogger().traceError(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
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
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_AUTH_REQUIRED,
                    { ...telemetryData, authStatus: authInfo?.Status || 'none' }
                );

                const authRequired = await vscode.window.showWarningMessage(
                    vscode.l10n.t(URI_HANDLER_STRINGS.PROMPTS.AUTH_REQUIRED),
                    { modal: true },
                    vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.YES),
                    vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.NO)
                );

                if (authRequired === vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.YES)) {
                    // Trigger authentication
                    await this.pacWrapper.authCreateNewAuthProfileForOrg(orgUrl);

                    // Check authentication again
                    const newAuthInfo = await this.pacWrapper.activeOrg();
                    if (!newAuthInfo || newAuthInfo.Status !== "Success") {
                        vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.AUTH_FAILED));
                        oneDSLoggerWrapper.getLogger().traceError(
                            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                            'Authentication failed after user initiated auth',
                            new Error('Authentication failed after user initiated auth'),
                            { ...telemetryData, error: 'auth_failed' }
                        );
                        return;
                    }

                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_AUTH_COMPLETED,
                        { ...telemetryData, newAuthStatus: newAuthInfo.Status }
                    );
                } else {
                    vscode.window.showInformationMessage(vscode.l10n.t(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_AUTH));
                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                        { ...telemetryData, reason: 'user_cancelled_auth' }
                    );
                    return;
                }
            }            // Check if the current environment matches the requested one
            const currentAuthInfo = await this.pacWrapper.activeOrg();
            if (currentAuthInfo?.Status === "Success" && currentAuthInfo.Results?.EnvironmentId !== environmentId) {
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_REQUIRED,
                    {
                        ...telemetryData,
                        currentEnvId: currentAuthInfo.Results?.EnvironmentId || 'unknown',
                        requestedEnvId: environmentId
                    }
                );

                const switchEnv = await vscode.window.showWarningMessage(
                    vscode.l10n.t(URI_HANDLER_STRINGS.PROMPTS.ENV_SWITCH_REQUIRED),
                    { modal: true },
                    vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.YES),
                    vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.NO)
                );

                if (switchEnv === vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.YES)) {
                    try {
                        // Switch to the correct environment
                        await this.pacWrapper.orgSelect(orgUrl);

                        // Verify the switch was successful
                        const verifyAuthInfo = await this.pacWrapper.activeOrg();
                        if (verifyAuthInfo?.Status !== "Success" || verifyAuthInfo.Results?.EnvironmentId !== environmentId) {
                            vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_FAILED));
                            oneDSLoggerWrapper.getLogger().traceError(
                                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                                'Failed to switch to required environment',
                                new Error('Failed to switch to required environment'),
                                { ...telemetryData, error: 'env_switch_failed' }
                            );
                            return;
                        }

                        oneDSLoggerWrapper.getLogger().traceInfo(
                            uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_COMPLETED,
                            { ...telemetryData, switchedToEnvId: verifyAuthInfo.Results?.EnvironmentId }
                        );
                    } catch (error) {
                        vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_ERROR, error instanceof Error ? error.message : String(error)));
                        oneDSLoggerWrapper.getLogger().traceError(
                            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                            'Error switching environment',
                            error instanceof Error ? error : new Error(String(error)),
                            { ...telemetryData, error: 'env_switch_error' }
                        );
                        return;
                    }
                } else {
                    vscode.window.showInformationMessage(vscode.l10n.t(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_ENV));
                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                        { ...telemetryData, reason: 'user_cancelled_env_switch' }
                    );
                    return;
                }
            }

            // Prompt user to select download folder
            const downloadResults = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: vscode.l10n.t(URI_HANDLER_STRINGS.PROMPTS.FOLDER_SELECT),
                title: vscode.l10n.t(URI_HANDLER_STRINGS.TITLES.DOWNLOAD_TITLE)
            });

            if (!downloadResults || downloadResults.length === 0) {
                vscode.window.showInformationMessage(vscode.l10n.t(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_FOLDER));
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    { ...telemetryData, reason: 'user_cancelled_folder_selection' }
                );
                return;
            }

            let selectedFolder = downloadResults[0];

            // Create a subfolder with the site name if provided
            if (siteName) {
                const sanitizedSiteName = siteName.replace(/[<>:"/\\|?*]/g, '_').trim();
                if (sanitizedSiteName) {
                    selectedFolder = vscode.Uri.joinPath(selectedFolder, sanitizedSiteName);
                    telemetryData.sanitizedSiteName = sanitizedSiteName;

                    try {
                        await vscode.workspace.fs.createDirectory(selectedFolder);
                    } catch (error) {
                        // Directory might already exist, continue
                    }
                }
            }

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

                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_DOWNLOAD_STARTED,
                    {
                        ...telemetryData,
                        downloadCommand: 'pac pages download',
                        downloadPath: selectedFolder.fsPath ? 'provided' : 'missing'
                    }
                );                // Show completion message after a delay
                setTimeout(async () => {
                    const openFolder = await vscode.window.showInformationMessage(
                        vscode.l10n.t(URI_HANDLER_STRINGS.PROMPTS.DOWNLOAD_COMPLETE),
                        vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.OPEN_FOLDER),
                        vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.OPEN_NEW_WORKSPACE),
                        vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.NOT_NOW)
                    );

                    if (openFolder === vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.OPEN_FOLDER)) {
                        // Open the folder in current workspace
                        await vscode.commands.executeCommand('vscode.openFolder', selectedFolder, false);
                        oneDSLoggerWrapper.getLogger().traceInfo(
                            uriHandlerTelemetryEventNames.URI_HANDLER_FOLDER_OPENED,
                            { ...telemetryData, openType: 'current_workspace' }
                        );
                    } else if (openFolder === vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.OPEN_NEW_WORKSPACE)) {
                        // Open the downloaded folder in a new workspace
                        await vscode.commands.executeCommand('vscode.openFolder', selectedFolder, true);
                        oneDSLoggerWrapper.getLogger().traceInfo(
                            uriHandlerTelemetryEventNames.URI_HANDLER_FOLDER_OPENED,
                            { ...telemetryData, openType: 'new_workspace' }
                        );
                    }

                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_DOWNLOAD_COMPLETED,
                        {
                            ...telemetryData,
                            completionAction: openFolder || 'none',
                            duration: (Date.now() - startTime).toString()
                        }
                    );
                }, URI_CONSTANTS.TIMEOUTS.COMPLETION_DIALOG);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.DOWNLOAD_FAILED, errorMessage));
                oneDSLoggerWrapper.getLogger().traceError(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    'Download failed',
                    error instanceof Error ? error : new Error(errorMessage),
                    { ...telemetryData, error: 'download_failed' }
                );
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.URI_HANDLER_FAILED, errorMessage));
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'URI handler failed',
                error instanceof Error ? error : new Error(errorMessage),
                { ...telemetryData, error: 'uri_handler_failed', duration: (Date.now() - startTime).toString() }
            );
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
