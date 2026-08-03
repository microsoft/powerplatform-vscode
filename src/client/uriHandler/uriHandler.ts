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
import { AuthEnvironmentService } from "./utils/authEnvironment";
import { AgenticCreateHandler } from "./handlers/agenticCreateHandler";
import { PacCreateHandler } from "./handlers/pacCreateHandler";

/**
 * Signature for a deep-link route handler. Each registered URI path maps to one handler.
 */
type UriRouteHandler = (uri: vscode.Uri) => Promise<void>;

export function RegisterUriHandler(pacWrapper: PacWrapper): vscode.Disposable {
    const uriHandler = new UriHandler(pacWrapper);
    return vscode.window.registerUriHandler(uriHandler);
}

export class UriHandler implements vscode.UriHandler {
    private readonly pacWrapper: PacWrapper;
    private readonly routes: ReadonlyMap<string, UriRouteHandler>;
    private readonly authEnvironmentService: AuthEnvironmentService;
    private readonly agenticCreateHandler: AgenticCreateHandler;
    private readonly pacCreateHandler: PacCreateHandler;

    constructor(pacWrapper: PacWrapper) {
        this.pacWrapper = pacWrapper;
        this.authEnvironmentService = new AuthEnvironmentService(pacWrapper);
        this.agenticCreateHandler = new AgenticCreateHandler(pacWrapper);
        this.pacCreateHandler = new PacCreateHandler(pacWrapper);
        this.routes = this.buildRoutes();
    }

    /**
     * Builds the deep-link routing table (URI path -> handler). Register new deep-link
     * paths here so `handleUri` can dispatch to them.
     */
    private buildRoutes(): ReadonlyMap<string, UriRouteHandler> {
        return new Map<string, UriRouteHandler>([
            [UriPath.PcfInit, () => this.pcfInit()],
            [UriPath.Open, (uri) => this.handleOpenPowerPages(uri)],
            [UriPath.AgenticCreate, (uri) => this.agenticCreateHandler.handle(uri)],
            [UriPath.PacCreate, (uri) => this.pacCreateHandler.handle(uri)],
        ]);
    }

    // URIs targeting our extension are in the format
    // vscode://<ExtensionName>/<PathArgs>?<QueryArgs>#<FragmentArgs>
    // vscode://microsoft-IsvExpTools.powerplatform-vscode/pcfInit
    // vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=xxx&envid=yyy&orgurl=zzz&schema=PortalSchemaV2
    public async handleUri(uri: vscode.Uri): Promise<void> {
        const route = this.routes.get(uri.path);
        if (route) {
            await route(uri);
            return;
        }
        // Unrecognized paths are intentionally ignored for forward compatibility.
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
                    name: URI_HANDLER_STRINGS.TITLES.PAC_CLI,
                    cwd: selectedFolder.fsPath,
                    isTransient: true,
                });

                terminal.show();
                terminal.sendText(URI_HANDLER_STRINGS.COMMANDS.PAC_PCF_INIT);

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
            await this.authEnvironmentService.prepareAuthenticationAndEnvironment(uriParams, telemetryData);

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
            throw new Error(URI_HANDLER_STRINGS.ERRORS.WEBSITE_ID_REQUIRED);
        }

        if (!uriParams.environmentId) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'Missing environment ID',
                new Error('Environment ID parameter is required but not provided'),
                { ...telemetryData, error: 'missing_environment_id' }
            );
            throw new Error(URI_HANDLER_STRINGS.ERRORS.ENVIRONMENT_ID_REQUIRED);
        }

        if (!uriParams.orgUrl) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'Missing organization URL',
                new Error('Organization URL parameter is required but not provided'),
                { ...telemetryData, error: 'missing_org_url' }
            );
            throw new Error(URI_HANDLER_STRINGS.ERRORS.ORG_URL_REQUIRED);
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
            throw new Error(URI_HANDLER_STRINGS.ERRORS.USER_CANCELLED_FOLDER_SELECTION);
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
                        throw new Error(URI_HANDLER_STRINGS.ERRORS.DOWNLOAD_FAILED.replace('{0}', errorMessage));
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

            await this.authEnvironmentService.resetPacProcessSafely(telemetryData);
            throw error;
        }
    }

}
