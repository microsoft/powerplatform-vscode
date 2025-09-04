/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../pac/PacWrapper";
import { oneDSLoggerWrapper } from "../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { UriPath } from "./constants/uriConstants";
import { URI_HANDLER_STRINGS } from "./constants/uriStrings";
import { uriHandlerTelemetryEventNames } from "./telemetry/uriHandlerTelemetryEvents";
import { UriHandlerUtils, UriParameters } from "./utils/uriHandlerUtils";

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

        try {
            // Parse URI parameters and validate
            const uriParams = UriHandlerUtils.parseUriParameters(uri);
            telemetryData = UriHandlerUtils.buildTelemetryData(uriParams, uri);

            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_TRIGGERED,
                telemetryData
            );

            // Validate required parameters
            this.validateRequiredParameters(uriParams, telemetryData);

            // Prepare authentication and environment
            await this.prepareAuthenticationAndEnvironment(uriParams, telemetryData);

            // Handle the download process
            await this.handleSiteDownload(uriParams, telemetryData, startTime);

        } catch (error) {
            UriHandlerUtils.handleError(error, telemetryData, startTime, 'URI handler failed');
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

    /**
     * Validate required parameters and throw errors if missing
     */
    private validateRequiredParameters(uriParams: UriParameters, telemetryData: Record<string, string>): void {
        if (!uriParams.websiteId) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'Missing website ID',
                new Error('Website ID parameter is required but not provided'),
                { ...telemetryData, error: 'missing_website_id' }
            );
            throw new Error('Website ID is required');
        }

        if (!uriParams.environmentId) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'Missing environment ID',
                new Error('Environment ID parameter is required but not provided'),
                { ...telemetryData, error: 'missing_environment_id' }
            );
            throw new Error('Environment ID is required');
        }

        if (!uriParams.orgUrl) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'Missing organization URL',
                new Error('Organization URL parameter is required but not provided'),
                { ...telemetryData, error: 'missing_org_url' }
            );
            throw new Error('Organization URL is required');
        }
    }

    /**
     * Handle authentication and environment setup
     */
    private async prepareAuthenticationAndEnvironment(uriParams: UriParameters, telemetryData: Record<string, string>): Promise<void> {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Power Pages",
                cancellable: false
            },
            async (progress) => {
                progress.report({
                    message: "Preparing to open Power Pages site...",
                    increment: 10
                });

                progress.report({
                    message: "Validating authentication...",
                    increment: 20
                });

                // Check and handle authentication
                await this.ensureAuthentication(uriParams, telemetryData, progress);

                progress.report({
                    message: "Checking environment...",
                    increment: 20
                });

                // Check and handle environment switching
                await this.ensureCorrectEnvironment(uriParams, telemetryData, progress);

                progress.report({
                    message: "Ready to select download folder",
                    increment: 30
                });

                // Brief delay to let user see the final progress message
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        );
    }

    /**
     * Ensure user is authenticated with PAC CLI
     */
    private async ensureAuthentication(uriParams: UriParameters, telemetryData: Record<string, string>, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
        let authInfo;
        try {
            authInfo = await this.pacWrapper.activeOrg();
        } catch (error) {
            await this.resetPacProcessAndThrow(error, telemetryData, 'Failed to check authentication status', 'auth_check_failed');
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

                    await this.pacWrapper.authCreateNewAuthProfileForOrg(uriParams.orgUrl!);

                    const newAuthInfo = await this.pacWrapper.activeOrg();
                    if (!newAuthInfo || newAuthInfo.Status !== "Success") {
                        throw new Error('Authentication failed after user initiated auth');
                    }

                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_AUTH_COMPLETED,
                        { ...telemetryData, newAuthStatus: newAuthInfo.Status }
                    );
                } catch (authError) {
                    await this.resetPacProcessAndThrow(authError, telemetryData, 'Authentication operation failed', 'auth_operation_failed');
                }
            } else {
                vscode.window.showInformationMessage(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_AUTH);
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    { ...telemetryData, reason: 'user_cancelled_auth' }
                );
                throw new Error('User cancelled authentication');
            }
        }
    }

    /**
     * Ensure we're connected to the correct environment
     */
    private async ensureCorrectEnvironment(uriParams: UriParameters, telemetryData: Record<string, string>, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
        let currentAuthInfo;
        try {
            currentAuthInfo = await this.pacWrapper.activeOrg();
        } catch (error) {
            await this.resetPacProcessAndThrow(error, telemetryData, 'Failed to check current environment', 'env_check_failed');
        }

        if (currentAuthInfo?.Status === "Success" && currentAuthInfo.Results?.EnvironmentId !== uriParams.environmentId) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_REQUIRED,
                {
                    ...telemetryData,
                    currentEnvId: currentAuthInfo.Results?.EnvironmentId || 'unknown',
                    requestedEnvId: uriParams.environmentId
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

                    await this.pacWrapper.orgSelect(uriParams.orgUrl!);

                    const verifyAuthInfo = await this.pacWrapper.activeOrg();
                    if (verifyAuthInfo?.Status !== "Success" || verifyAuthInfo.Results?.EnvironmentId !== uriParams.environmentId) {
                        throw new Error('Failed to switch to required environment');
                    }

                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_COMPLETED,
                        { ...telemetryData, switchedToEnvId: verifyAuthInfo.Results?.EnvironmentId }
                    );
                } catch (error) {
                    await this.resetPacProcessAndThrow(error, telemetryData, 'Error switching environment', 'env_switch_error');
                }
            } else {
                vscode.window.showInformationMessage(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_ENV);
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    { ...telemetryData, reason: 'user_cancelled_env_switch' }
                );
                throw new Error('User cancelled environment switch');
            }
        }
    }

    /**
     * Handle the site download process
     */
    private async handleSiteDownload(uriParams: UriParameters, telemetryData: Record<string, string>, startTime: number): Promise<void> {
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
            throw new Error('User cancelled folder selection');
        }

        const selectedFolder = downloadResults[0];
        await this.executeDownload(selectedFolder, uriParams, telemetryData, startTime);
    }

    /**
     * Execute the actual download operation
     */
    private async executeDownload(selectedFolder: vscode.Uri, uriParams: UriParameters, telemetryData: Record<string, string>, startTime: number): Promise<void> {
        try {
            const downloadCommand = `pages download -p "${selectedFolder.fsPath}" -id ${uriParams.websiteId} -mv ${uriParams.modelVersion}`;

            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_DOWNLOAD_STARTED,
                {
                    ...telemetryData,
                    downloadCommand: downloadCommand,
                    downloadPath: selectedFolder.fsPath ? 'provided' : 'missing'
                }
            );

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `Downloading site using: pac ${downloadCommand}`,
                    cancellable: false
                },
                async (_) => {
                    const downloadResult = await this.pacWrapper.downloadSite(
                        selectedFolder.fsPath,
                        uriParams.websiteId!,
                        uriParams.modelVersion as 1 | 2
                    );

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

            await this.handleDownloadCompletion(selectedFolder, telemetryData, startTime, uriParams.siteName, uriParams.siteUrl);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'Download failed',
                error instanceof Error ? error : new Error(errorMessage),
                { ...telemetryData, error: 'download_failed' }
            );

            await this.resetPacProcessSafely(telemetryData);
            throw error;
        }
    }

    /**
     * Reset PAC process and throw error
     */
    private async resetPacProcessAndThrow(error: unknown, telemetryData: Record<string, string>, message: string, errorType: string): Promise<never> {
        oneDSLoggerWrapper.getLogger().traceError(
            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
            message,
            error instanceof Error ? error : new Error(String(error)),
            { ...telemetryData, error: errorType }
        );

        await this.resetPacProcessSafely(telemetryData);
        throw error;
    }

    /**
     * Safely reset PAC process without throwing
     */
    private async resetPacProcessSafely(telemetryData: Record<string, string>): Promise<void> {
        try {
            await this.pacWrapper.resetPacProcess();
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                { ...telemetryData, message: 'PAC process reset after failure' }
            );
        } catch (resetError) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'Failed to reset PAC process after failure',
                resetError instanceof Error ? resetError : new Error(String(resetError)),
                { ...telemetryData, error: 'pac_reset_failed' }
            );
        }
    }

}
