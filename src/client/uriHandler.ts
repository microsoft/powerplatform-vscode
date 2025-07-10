/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "./pac/PacWrapper";

export function RegisterUriHandler(pacWrapper: PacWrapper): vscode.Disposable {
    const uriHandler = new UriHandler(pacWrapper);
    return vscode.window.registerUriHandler(uriHandler);
}

enum UriPath {
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
    // vscode://microsoft-IsvExpTools.powerplatform-vscode/open?websiteid=xxx&envid=yyy&orgurl=zzz
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
        try {
            // Parse query parameters from the URI
            const urlParams = new URLSearchParams(uri.query);

            // Extract required parameters
            const websiteId = urlParams.get('websiteid');
            const environmentId = urlParams.get('envid');
            const orgUrl = urlParams.get('orgurl');

            // Validate required parameters
            if (!websiteId) {
                vscode.window.showErrorMessage(vscode.l10n.t("Website ID is required but not provided"));
                return;
            }

            if (!environmentId) {
                vscode.window.showErrorMessage(vscode.l10n.t("Environment ID is required but not provided"));
                return;
            }

            if (!orgUrl) {
                vscode.window.showErrorMessage(vscode.l10n.t("Organization URL is required but not provided"));
                return;
            }

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
                    await vscode.commands.executeCommand('microsoft.powerplatform.auth.create');

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

            // Check if the selected folder is empty or ask for confirmation if not
            const files = await vscode.workspace.fs.readDirectory(selectedFolder);
            if (files.length > 0) {
                const overwrite = await vscode.window.showWarningMessage(
                    vscode.l10n.t("The selected folder is not empty. Contents may be overwritten. Continue?"),
                    { modal: true },
                    vscode.l10n.t("Yes"),
                    vscode.l10n.t("No")
                );

                if (overwrite !== vscode.l10n.t("Yes")) {
                    vscode.window.showInformationMessage(vscode.l10n.t("Site download cancelled."));
                    return;
                }
            }

            // Show progress and download the site
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: vscode.l10n.t("Downloading Power Pages Site"),
                cancellable: false
            }, async (progress) => {
                progress.report({ message: vscode.l10n.t("Initializing download...") });

                try {
                    progress.report({ message: vscode.l10n.t("Downloading site files...") });

                    // Execute the pac pages download command
                    const downloadCommand = `pac pages download --path "${selectedFolder.fsPath}" --websiteId "${websiteId}" --modelVersion 2`;

                    const terminal = vscode.window.createTerminal({
                        name: "Power Pages Download",
                        cwd: selectedFolder.fsPath,
                        isTransient: false,
                    });

                    terminal.show();
                    terminal.sendText(downloadCommand);

                    progress.report({ message: vscode.l10n.t("Download initiated. Check terminal for progress.") });

                    // Wait a moment for the command to start
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Ask if user wants to open the downloaded site in a new workspace
                    const openWorkspace = await vscode.window.showInformationMessage(
                        vscode.l10n.t("Site download initiated. Would you like to open the downloaded site in a new workspace when complete?"),
                        vscode.l10n.t("Yes"),
                        vscode.l10n.t("No")
                    );

                    if (openWorkspace === vscode.l10n.t("Yes")) {
                        // Open the downloaded folder in a new workspace
                        await vscode.commands.executeCommand('vscode.openFolder', selectedFolder, true);
                    }

                } catch (error) {
                    progress.report({ message: vscode.l10n.t("Download failed") });
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(vscode.l10n.t("Failed to download site: {0}", errorMessage));
                }
            });

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
