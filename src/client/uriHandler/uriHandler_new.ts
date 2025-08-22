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
import { createFolderName, findSiteFolder, promptToOpenFolder, validateRequiredParameters } from "./uriHandlerUtils";
import { runCodeQLScreening } from "../power-pages/actions-hub/ActionsHubCommandHandlers";

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
    // vscode://microsoft-IsvExpTools.powerplatform-vscode/openWithCodeQL?websiteid=xxx&envid=yyy&orgurl=zzz&schema=PortalSchemaV2
    public async handleUri(uri: vscode.Uri): Promise<void> {
        if (uri.path === UriPath.PcfInit) {
            return this.pcfInit();
        } else if (uri.path === UriPath.Open) {
            return this.handleOpenPowerPages(uri);
        } else if (uri.path === UriPath.OpenWithCodeQL) {
            return this.handleOpenPowerPagesWithCodeQL(uri);
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

    /**
     * Common download logic shared between open and openWithCodeQL handlers
     */
    private async downloadPowerPagesSite(
        uri: vscode.Uri,
        telemetryEventTriggered: string,
        telemetryEventFailed: string
    ): Promise<{
        success: boolean;
        folderPath?: string;
        telemetryData: Record<string, string>;
        startTime: number;
    }> {
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
            const siteUrl = urlParams.get(URI_CONSTANTS.PARAMETERS.SITE_URL);

            // Populate telemetry data
            telemetryData = {
                websiteId: websiteId || 'missing',
                environmentId: environmentId || 'missing',
                orgUrl: orgUrl ? 'provided' : 'missing',
                schema: schema || 'none',
                siteName: siteName ? 'provided' : 'missing',
                siteUrl: siteUrl ? 'provided' : 'missing',
                uriQuery: uri.query || 'empty'
            };

            oneDSLoggerWrapper.getLogger().traceInfo(telemetryEventTriggered, telemetryData);

            // Validate required parameters using utility function
            const requiredParams = [URI_CONSTANTS.PARAMETERS.WEBSITE_ID, URI_CONSTANTS.PARAMETERS.ENV_ID, URI_CONSTANTS.PARAMETERS.ORG_URL];
            const paramMap = {
                [URI_CONSTANTS.PARAMETERS.WEBSITE_ID]: websiteId,
                [URI_CONSTANTS.PARAMETERS.ENV_ID]: environmentId,
                [URI_CONSTANTS.PARAMETERS.ORG_URL]: orgUrl
            };

            const validationError = validateRequiredParameters(paramMap, requiredParams);
            if (validationError) {
                vscode.window.showErrorMessage(vscode.l10n.t(validationError));
                oneDSLoggerWrapper.getLogger().traceError(
                    telemetryEventFailed,
                    'Parameter validation failed',
                    new Error(validationError),
                    { ...telemetryData, error: 'parameter_validation_failed' }
                );
                return { success: false, telemetryData, startTime };
            }

            // Determine model version based on schema parameter
            const modelVersion = schema && schema.toLowerCase() === URI_CONSTANTS.SCHEMA_VALUES.PORTAL_SCHEMA_V2
                ? URI_CONSTANTS.MODEL_VERSIONS.VERSION_2
                : URI_CONSTANTS.MODEL_VERSIONS.VERSION_1;

            telemetryData.modelVersion = modelVersion.toString();

            // Check authentication and environment
            const authResult = await this.handleAuthenticationAndEnvironment(
                orgUrl!, environmentId!, telemetryData, telemetryEventFailed
            );
            if (!authResult.success) {
                return { success: false, telemetryData, startTime };
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
                    telemetryEventFailed,
                    { ...telemetryData, reason: 'user_cancelled_folder_selection' }
                );
                return { success: false, telemetryData, startTime };
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

            // Execute the download
            await this.performDownload(
                selectedFolder, websiteId!, modelVersion as 1 | 2, telemetryData, startTime, telemetryEventFailed
            );

            // Find the actual downloaded folder
            let folderToOpen = selectedFolder;
            if (siteName) {
                const mainSiteName = siteUrl ? new URL(siteUrl).hostname : undefined;
                const expectedFolderName = createFolderName(siteName, mainSiteName);

                const foundFolder = findSiteFolder(selectedFolder.fsPath, expectedFolderName);
                if (foundFolder) {
                    folderToOpen = vscode.Uri.file(foundFolder);
                    telemetryData.downloadedFolderFound = 'true';
                    telemetryData.expectedFolderName = expectedFolderName;
                } else {
                    telemetryData.downloadedFolderFound = 'false';
                    telemetryData.expectedFolderName = expectedFolderName;
                }
            }

            return {
                success: true,
                folderPath: folderToOpen.fsPath,
                telemetryData,
                startTime
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.URI_HANDLER_FAILED, errorMessage));
            oneDSLoggerWrapper.getLogger().traceError(
                telemetryEventFailed,
                'Download process failed',
                error instanceof Error ? error : new Error(errorMessage),
                { ...telemetryData, error: 'download_process_failed', duration: (Date.now() - startTime).toString() }
            );
            return { success: false, telemetryData, startTime };
        }
    }

    /**
     * Handles authentication and environment switching logic
     */
    private async handleAuthenticationAndEnvironment(
        orgUrl: string,
        environmentId: string,
        telemetryData: Record<string, string>,
        telemetryEventFailed: string
    ): Promise<{ success: boolean }> {
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
                await this.pacWrapper.authCreateNewAuthProfileForOrg(orgUrl);

                const newAuthInfo = await this.pacWrapper.activeOrg();
                if (!newAuthInfo || newAuthInfo.Status !== "Success") {
                    vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.AUTH_FAILED));
                    oneDSLoggerWrapper.getLogger().traceError(
                        telemetryEventFailed,
                        'Authentication failed after user initiated auth',
                        new Error('Authentication failed after user initiated auth'),
                        { ...telemetryData, error: 'auth_failed' }
                    );
                    return { success: false };
                }

                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_AUTH_COMPLETED,
                    { ...telemetryData, newAuthStatus: newAuthInfo.Status }
                );
            } else {
                vscode.window.showInformationMessage(vscode.l10n.t(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_AUTH));
                oneDSLoggerWrapper.getLogger().traceInfo(
                    telemetryEventFailed,
                    { ...telemetryData, reason: 'user_cancelled_auth' }
                );
                return { success: false };
            }
        }

        // Check if the current environment matches the requested one
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
                    await this.pacWrapper.orgSelect(orgUrl);

                    const verifyAuthInfo = await this.pacWrapper.activeOrg();
                    if (verifyAuthInfo?.Status !== "Success" || verifyAuthInfo.Results?.EnvironmentId !== environmentId) {
                        vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_FAILED));
                        oneDSLoggerWrapper.getLogger().traceError(
                            telemetryEventFailed,
                            'Failed to switch to required environment',
                            new Error('Failed to switch to required environment'),
                            { ...telemetryData, error: 'env_switch_failed' }
                        );
                        return { success: false };
                    }

                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_COMPLETED,
                        { ...telemetryData, switchedToEnvId: verifyAuthInfo.Results?.EnvironmentId }
                    );
                } catch (error) {
                    vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_ERROR, error instanceof Error ? error.message : String(error)));
                    oneDSLoggerWrapper.getLogger().traceError(
                        telemetryEventFailed,
                        'Error switching environment',
                        error instanceof Error ? error : new Error(String(error)),
                        { ...telemetryData, error: 'env_switch_error' }
                    );
                    return { success: false };
                }
            } else {
                vscode.window.showInformationMessage(vscode.l10n.t(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_ENV));
                oneDSLoggerWrapper.getLogger().traceInfo(
                    telemetryEventFailed,
                    { ...telemetryData, reason: 'user_cancelled_env_switch' }
                );
                return { success: false };
            }
        }

        return { success: true };
    }

    /**
     * Performs the actual download operation
     */
    private async performDownload(
        selectedFolder: vscode.Uri,
        websiteId: string,
        modelVersion: 1 | 2,
        telemetryData: Record<string, string>,
        startTime: number,
        telemetryEventFailed: string
    ): Promise<void> {
        oneDSLoggerWrapper.getLogger().traceInfo(
            uriHandlerTelemetryEventNames.URI_HANDLER_DOWNLOAD_STARTED,
            {
                ...telemetryData,
                downloadCommand: 'pac pages download',
                downloadPath: selectedFolder.fsPath ? 'provided' : 'missing'
            }
        );

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: vscode.l10n.t(URI_HANDLER_STRINGS.INFO.DOWNLOAD_STARTED, modelVersion.toString()),
                cancellable: false
            },
            async (progress) => {
                progress.report({
                    message: vscode.l10n.t(URI_HANDLER_STRINGS.INFO.DOWNLOAD_PREPARING),
                    increment: 10
                });

                progress.report({
                    message: vscode.l10n.t(URI_HANDLER_STRINGS.INFO.DOWNLOAD_PROCESSING),
                    increment: 20
                });

                const downloadResult = await this.pacWrapper.downloadSite(
                    selectedFolder.fsPath,
                    websiteId,
                    modelVersion
                );

                progress.report({
                    message: vscode.l10n.t(URI_HANDLER_STRINGS.INFO.DOWNLOAD_IN_PROGRESS),
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
    }

    async handleOpenPowerPages(uri: vscode.Uri): Promise<void> {
        const downloadResult = await this.downloadPowerPagesSite(
            uri,
            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_TRIGGERED,
            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED
        );

        if (downloadResult.success && downloadResult.folderPath) {
            await promptToOpenFolder(
                downloadResult.folderPath,
                vscode.l10n.t(URI_HANDLER_STRINGS.PROMPTS.DOWNLOAD_COMPLETE),
                vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.OPEN_FOLDER),
                vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.OPEN_NEW_WORKSPACE),
                vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.NOT_NOW)
            );

            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_DOWNLOAD_COMPLETED,
                {
                    ...downloadResult.telemetryData,
                    duration: (Date.now() - downloadResult.startTime).toString()
                }
            );
        }
    }

    async handleOpenPowerPagesWithCodeQL(uri: vscode.Uri): Promise<void> {
        const startTime = Date.now();

        try {
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_WITH_CODEQL_TRIGGERED,
                { timestamp: startTime.toString() }
            );

            // First, download the site using common logic
            const downloadResult = await this.downloadPowerPagesSite(
                uri,
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_WITH_CODEQL_TRIGGERED,
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_WITH_CODEQL_FAILED
            );

            if (!downloadResult.success || !downloadResult.folderPath) {
                return; // Error already logged in downloadPowerPagesSite
            }

            // Run CodeQL screening on the downloaded folder
            await this.runCodeQLScreeningOnFolder(downloadResult.folderPath, downloadResult.telemetryData);

            // Prompt to open folder with CodeQL-specific message
            await promptToOpenFolder(
                downloadResult.folderPath,
                vscode.l10n.t(URI_HANDLER_STRINGS.PROMPTS.DOWNLOAD_COMPLETE_WITH_CODEQL),
                vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.OPEN_FOLDER),
                vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.OPEN_NEW_WORKSPACE),
                vscode.l10n.t(URI_HANDLER_STRINGS.BUTTONS.NOT_NOW)
            );

            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_DOWNLOAD_COMPLETED,
                {
                    ...downloadResult.telemetryData,
                    withCodeQL: 'true',
                    duration: (Date.now() - startTime).toString()
                }
            );

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.URI_HANDLER_FAILED, errorMessage));
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_WITH_CODEQL_FAILED,
                'CodeQL handler failed',
                error instanceof Error ? error : new Error(errorMessage),
                { duration: (Date.now() - startTime).toString() }
            );
        }
    }

    /**
     * Runs CodeQL screening on the downloaded folder
     */
    private async runCodeQLScreeningOnFolder(
        folderPath: string,
        telemetryData: Record<string, string>
    ): Promise<void> {
        const startTime = Date.now();

        try {
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_CODEQL_SCREENING_STARTED,
                { ...telemetryData, folderPath: 'provided' }
            );

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: vscode.l10n.t(URI_HANDLER_STRINGS.INFO.CODEQL_SCREENING_STARTED),
                    cancellable: false
                },
                async (progress) => {
                    progress.report({
                        message: vscode.l10n.t(URI_HANDLER_STRINGS.INFO.CODEQL_SCREENING_IN_PROGRESS),
                        increment: 10
                    });

                    // Use the existing runCodeQLScreening function
                    await runCodeQLScreening(vscode.Uri.file(folderPath));

                    progress.report({
                        message: vscode.l10n.t(URI_HANDLER_STRINGS.INFO.CODEQL_SCREENING_COMPLETED),
                        increment: 90
                    });
                }
            );

            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_CODEQL_SCREENING_COMPLETED,
                {
                    ...telemetryData,
                    duration: (Date.now() - startTime).toString()
                }
            );

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(vscode.l10n.t(URI_HANDLER_STRINGS.ERRORS.CODEQL_SCREENING_FAILED, errorMessage));
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_CODEQL_SCREENING_FAILED,
                'CodeQL screening failed',
                error instanceof Error ? error : new Error(errorMessage),
                {
                    ...telemetryData,
                    error: 'codeql_screening_failed',
                    duration: (Date.now() - startTime).toString()
                }
            );
            throw error; // Re-throw to be handled by caller
        }
    }
}
