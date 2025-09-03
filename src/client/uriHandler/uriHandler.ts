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
import { UriHandlerUtils } from "./utils/uriHandlerUtils";

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

            const pcfInitLabel = URI_HANDLER_STRINGS.TITLES.PCF_INIT;

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

        // Show initial progress notification to indicate processing has started
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Power Pages",
                cancellable: false
            },
            async (progress) => {
                try {
                    progress.report({
                        message: "Preparing to open Power Pages site...",
                        increment: 10
                    });

                    // Parse query parameters from the URI
                    const urlParams = new URLSearchParams(uri.query);

                    // Extract required parameters
                    const websiteId = urlParams.get(URI_CONSTANTS.PARAMETERS.WEBSITE_ID);
                    const environmentId = urlParams.get(URI_CONSTANTS.PARAMETERS.ENV_ID);
                    const orgUrl = urlParams.get(URI_CONSTANTS.PARAMETERS.ORG_URL);
                    const schema = urlParams.get(URI_CONSTANTS.PARAMETERS.SCHEMA);
                    const siteName = urlParams.get(URI_CONSTANTS.PARAMETERS.SITE_NAME);
                    const siteUrl = urlParams.get(URI_CONSTANTS.PARAMETERS.SITE_URL);

                    // Populate telemetry data
                    telemetryData = {
                        websiteId: websiteId || 'missing',
                        environmentId: environmentId || 'missing',
                        orgUrl: orgUrl ? 'provided' : 'missing', // Don't log actual URL for privacy
                        schema: schema || 'none',
                        siteName: siteName ? 'provided' : 'missing',
                        siteUrl: siteUrl ? 'provided' : 'missing', // Don't log actual URL for privacy
                        uriQuery: uri.query || 'empty'
                    };

                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_TRIGGERED,
                        telemetryData
                    );

                    // Validate required parameters
                    if (!websiteId) {
                        vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.WEBSITE_ID_REQUIRED);
                        oneDSLoggerWrapper.getLogger().traceError(
                            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                            'Missing website ID',
                            new Error('Website ID parameter is required but not provided'),
                            { ...telemetryData, error: 'missing_website_id' }
                        );
                        return;
                    }

                    if (!environmentId) {
                        vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.ENVIRONMENT_ID_REQUIRED);
                        oneDSLoggerWrapper.getLogger().traceError(
                            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                            'Missing environment ID',
                            new Error('Environment ID parameter is required but not provided'),
                            { ...telemetryData, error: 'missing_environment_id' }
                        );
                        return;
                    }

                    if (!orgUrl) {
                        vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.ORG_URL_REQUIRED);
                        oneDSLoggerWrapper.getLogger().traceError(
                            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                            'Missing organization URL',
                            new Error('Organization URL parameter is required but not provided'),
                            { ...telemetryData, error: 'missing_org_url' }
                        );
                        return;
                    }

                    progress.report({
                        message: "Validating authentication...",
                        increment: 20
                    });

                    // Determine model version based on schema parameter
                    // If schema is "PortalSchemaV2" (case-insensitive), use model version 2, otherwise use 1
                    const modelVersion = schema && schema.toLowerCase() === URI_CONSTANTS.SCHEMA_VALUES.PORTAL_SCHEMA_V2
                        ? URI_CONSTANTS.MODEL_VERSIONS.VERSION_2
                        : URI_CONSTANTS.MODEL_VERSIONS.VERSION_1;

                    telemetryData.modelVersion = modelVersion.toString();

                    // Check if user is authenticated with PAC CLI
                    let authInfo;
                    try {
                        authInfo = await this.pacWrapper.activeOrg();
                    } catch (error) {
                        vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.AUTH_FAILED);
                        oneDSLoggerWrapper.getLogger().traceError(
                            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                            'Failed to check authentication status',
                            error instanceof Error ? error : new Error(String(error)),
                            { ...telemetryData, error: 'auth_check_failed' }
                        );

                        // Reset PAC CLI process for future operations
                        try {
                            await this.pacWrapper.resetPacProcess();
                        } catch {
                            // Ignore reset errors
                        }
                        return;
                    }

                    if (!authInfo || authInfo.Status !== "Success") {
                        oneDSLoggerWrapper.getLogger().traceInfo(
                            uriHandlerTelemetryEventNames.URI_HANDLER_AUTH_REQUIRED,
                            { ...telemetryData, authStatus: authInfo?.Status || 'none' }
                        );

                        progress.report({
                            message: "Authentication required...",
                            increment: 10
                        });

                        const authRequired = await vscode.window.showWarningMessage(
                            URI_HANDLER_STRINGS.PROMPTS.AUTH_REQUIRED,
                            { modal: true },
                            URI_HANDLER_STRINGS.BUTTONS.YES,
                            URI_HANDLER_STRINGS.BUTTONS.NO
                        );

                        if (authRequired === URI_HANDLER_STRINGS.BUTTONS.YES) {
                            try {
                                progress.report({
                                    message: "Authenticating...",
                                    increment: 10
                                });

                                // Trigger authentication
                                await this.pacWrapper.authCreateNewAuthProfileForOrg(orgUrl);

                                // Check authentication again
                                const newAuthInfo = await this.pacWrapper.activeOrg();
                                if (!newAuthInfo || newAuthInfo.Status !== "Success") {
                                    vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.AUTH_FAILED);
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
                            } catch (authError) {
                                vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.AUTH_FAILED);
                                oneDSLoggerWrapper.getLogger().traceError(
                                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                                    'Authentication operation failed',
                                    authError instanceof Error ? authError : new Error(String(authError)),
                                    { ...telemetryData, error: 'auth_operation_failed' }
                                );

                                // Reset PAC CLI process after auth failure
                                try {
                                    await this.pacWrapper.resetPacProcess();
                                } catch {
                                    // Ignore reset errors
                                }
                                return;
                            }
                        } else {
                            vscode.window.showInformationMessage(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_AUTH);
                            oneDSLoggerWrapper.getLogger().traceInfo(
                                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                                { ...telemetryData, reason: 'user_cancelled_auth' }
                            );
                            return;
                        }
                    }

                    progress.report({
                        message: "Checking environment...",
                        increment: 10
                    });

                    // Check if the current environment matches the requested one
                    let currentAuthInfo;
                    try {
                        currentAuthInfo = await this.pacWrapper.activeOrg();
                    } catch (error) {
                        vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_FAILED);
                        oneDSLoggerWrapper.getLogger().traceError(
                            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                            'Failed to check current environment',
                            error instanceof Error ? error : new Error(String(error)),
                            { ...telemetryData, error: 'env_check_failed' }
                        );

                        // Reset PAC CLI process for future operations
                        try {
                            await this.pacWrapper.resetPacProcess();
                        } catch {
                            // Ignore reset errors
                        }
                        return;
                    }

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
                            URI_HANDLER_STRINGS.PROMPTS.ENV_SWITCH_REQUIRED,
                            { modal: true },
                            URI_HANDLER_STRINGS.BUTTONS.YES,
                            URI_HANDLER_STRINGS.BUTTONS.NO
                        );

                        if (switchEnv === URI_HANDLER_STRINGS.BUTTONS.YES) {
                            try {
                                progress.report({
                                    message: "Switching environment...",
                                    increment: 10
                                });

                                // Switch to the correct environment
                                await this.pacWrapper.orgSelect(orgUrl);

                                // Verify the switch was successful
                                const verifyAuthInfo = await this.pacWrapper.activeOrg();
                                if (verifyAuthInfo?.Status !== "Success" || verifyAuthInfo.Results?.EnvironmentId !== environmentId) {
                                    vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_FAILED);
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
                                vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_ERROR.replace('{0}', error instanceof Error ? error.message : String(error)));
                                oneDSLoggerWrapper.getLogger().traceError(
                                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                                    'Error switching environment',
                                    error instanceof Error ? error : new Error(String(error)),
                                    { ...telemetryData, error: 'env_switch_error' }
                                );

                                // Reset PAC CLI process after environment switch failure
                                try {
                                    await this.pacWrapper.resetPacProcess();
                                } catch {
                                    // Ignore reset errors
                                }
                                return;
                            }
                        } else {
                            vscode.window.showInformationMessage(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_ENV);
                            oneDSLoggerWrapper.getLogger().traceInfo(
                                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                                { ...telemetryData, reason: 'user_cancelled_env_switch' }
                            );
                            return;
                        }
                    }

                    progress.report({
                        message: "Ready to select download folder",
                        increment: 10
                    });

                    // Brief delay to let user see the final progress message
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.URI_HANDLER_FAILED.replace('{0}', errorMessage));
                    oneDSLoggerWrapper.getLogger().traceError(
                        uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                        'URI handler failed during preparation',
                        error instanceof Error ? error : new Error(errorMessage),
                        { ...telemetryData, error: 'uri_handler_preparation_failed', duration: (Date.now() - startTime).toString() }
                    );
                    return;
                }
            }
        );

        try {
            // Prompt user to select download folder
            const downloadResults = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: URI_HANDLER_STRINGS.PROMPTS.FOLDER_SELECT,
                title: URI_HANDLER_STRINGS.TITLES.DOWNLOAD_TITLE
            });

            if (!downloadResults || downloadResults.length === 0) {
                vscode.window.showInformationMessage(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_FOLDER);
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    { ...telemetryData, reason: 'user_cancelled_folder_selection' }
                );
                return;
            }

            const urlParams = new URLSearchParams(uri.query);
            const websiteId = urlParams.get(URI_CONSTANTS.PARAMETERS.WEBSITE_ID)!;
            const schema = urlParams.get(URI_CONSTANTS.PARAMETERS.SCHEMA);
            const siteName = urlParams.get(URI_CONSTANTS.PARAMETERS.SITE_NAME);
            const siteUrl = urlParams.get(URI_CONSTANTS.PARAMETERS.SITE_URL);

            const modelVersion = schema && schema.toLowerCase() === URI_CONSTANTS.SCHEMA_VALUES.PORTAL_SCHEMA_V2
                ? URI_CONSTANTS.MODEL_VERSIONS.VERSION_2
                : URI_CONSTANTS.MODEL_VERSIONS.VERSION_1;

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

            // Execute the pac pages download command using PacWrapper
            try {
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_DOWNLOAD_STARTED,
                    {
                        ...telemetryData,
                        downloadCommand: 'pac pages download',
                        downloadPath: selectedFolder.fsPath ? 'provided' : 'missing'
                    }
                );

                // Show progress notification while downloading
                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: URI_HANDLER_STRINGS.INFO.DOWNLOAD_STARTED.replace('{0}', modelVersion.toString()),
                        cancellable: false
                    },
                    async (progress) => {
                        progress.report({
                            message: URI_HANDLER_STRINGS.INFO.DOWNLOAD_PREPARING,
                            increment: 10
                        });

                        progress.report({
                            message: URI_HANDLER_STRINGS.INFO.DOWNLOAD_PROCESSING,
                            increment: 20
                        });

                        // Use PacWrapper's downloadSite method instead of terminal
                        const downloadResult = await this.pacWrapper.downloadSite(
                            selectedFolder.fsPath,
                            websiteId,
                            modelVersion as 1 | 2
                        );

                        progress.report({
                            message: URI_HANDLER_STRINGS.INFO.DOWNLOAD_IN_PROGRESS,
                            increment: 70
                        });

                        if (downloadResult.Status !== "Success") {
                            const errorMessage = downloadResult.Errors?.length > 0
                                ? downloadResult.Errors.join('; ')
                                : 'Unknown error occurred during download';
                            throw new Error(`Download failed: ${errorMessage}`);
                        }

                        oneDSLoggerWrapper.getLogger().traceInfo(
                            uriHandlerTelemetryEventNames.URI_HANDLER_DOWNLOAD_COMPLETED,
                            {
                                ...telemetryData,
                                downloadStatus: downloadResult.Status,
                                duration: (Date.now() - startTime).toString()
                            }
                        );
                    }
                );

                // Show completion dialog
                await this.handleDownloadCompletion(selectedFolder, telemetryData, startTime, siteName, siteUrl);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.DOWNLOAD_FAILED.replace('{0}', errorMessage));
                oneDSLoggerWrapper.getLogger().traceError(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    'Download failed',
                    error instanceof Error ? error : new Error(errorMessage),
                    { ...telemetryData, error: 'download_failed' }
                );

                // Reset PAC CLI process to ensure it's in a clean state for next operation
                try {
                    await this.pacWrapper.resetPacProcess();
                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                        { ...telemetryData, message: 'PAC process reset after download failure' }
                    );
                } catch (resetError) {
                    oneDSLoggerWrapper.getLogger().traceError(
                        uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                        'Failed to reset PAC process after download failure',
                        resetError instanceof Error ? resetError : new Error(String(resetError)),
                        { ...telemetryData, error: 'pac_reset_failed' }
                    );
                }
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.URI_HANDLER_FAILED.replace('{0}', errorMessage));
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'URI handler failed',
                error instanceof Error ? error : new Error(errorMessage),
                { ...telemetryData, error: 'uri_handler_failed', duration: (Date.now() - startTime).toString() }
            );
        }
    }

    /**
     * Handles the completion dialog after download finishes
     */
    private async handleDownloadCompletion(
        selectedFolder: vscode.Uri,
        telemetryData: Record<string, string>,
        startTime: number,
        siteName: string | null,
        siteUrl: string | null
    ): Promise<void> {
        // Try to find the actual downloaded folder using the naming pattern
        let folderToOpen = selectedFolder;
        const expectedFolderName = UriHandlerUtils.generateExpectedFolderName(siteName, siteUrl);

        if (expectedFolderName) {
            const foundFolder = await UriHandlerUtils.findDownloadedFolder(selectedFolder, expectedFolderName);
            if (foundFolder) {
                folderToOpen = foundFolder;
                telemetryData.downloadedFolderFound = 'true';
                telemetryData.expectedFolderName = expectedFolderName;
            } else {
                telemetryData.downloadedFolderFound = 'false';
                telemetryData.expectedFolderName = expectedFolderName;
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_DOWNLOAD_COMPLETED,
                    { ...telemetryData, message: 'Expected folder not found, using selected folder' }
                );
            }
        }

        const openFolder = await vscode.window.showInformationMessage(
            URI_HANDLER_STRINGS.PROMPTS.DOWNLOAD_COMPLETE,
            URI_HANDLER_STRINGS.BUTTONS.OPEN_FOLDER,
            URI_HANDLER_STRINGS.BUTTONS.OPEN_NEW_WORKSPACE,
            URI_HANDLER_STRINGS.BUTTONS.NOT_NOW
        );

        if (openFolder === URI_HANDLER_STRINGS.BUTTONS.OPEN_FOLDER) {
            await vscode.commands.executeCommand('vscode.openFolder', folderToOpen, false);
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_FOLDER_OPENED,
                { ...telemetryData, openType: 'current_workspace', actualFolderOpened: folderToOpen.fsPath }
            );
        } else if (openFolder === URI_HANDLER_STRINGS.BUTTONS.OPEN_NEW_WORKSPACE) {
            await vscode.commands.executeCommand('vscode.openFolder', folderToOpen, true);
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_FOLDER_OPENED,
                { ...telemetryData, openType: 'new_workspace', actualFolderOpened: folderToOpen.fsPath }
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
    }

}
