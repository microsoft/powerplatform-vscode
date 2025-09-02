/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { PacTerminal } from "../../lib/PacTerminal";
import { Constants, SUCCESS } from "../../../common/power-pages/metadata-diff/Constants";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { MetadataDiffTreeDataProvider } from "../../../common/power-pages/metadata-diff/MetadataDiffTreeDataProvider";
import { createAuthProfileExp } from "../../../common/utilities/PacAuthUtil";
import { getWebsiteRecordId } from "../../../common/utilities/WorkspaceInfoFinderUtil";
import { MetadataDiffDesktop } from "./MetadataDiffDesktop";
import { generateDiffReport, getAllDiffFiles, MetadataDiffReport } from "./MetadataDiffUtils";

export async function registerMetadataDiffCommands(context: vscode.ExtensionContext, pacTerminal: PacTerminal): Promise<void> {
    // Register command for handling file diffs
    vscode.commands.registerCommand('metadataDiff.openDiff', async (workspaceFile: string, storedFile: string) => {
        try {
            const workspaceUri = vscode.Uri.file(workspaceFile);
            const storedUri = vscode.Uri.file(storedFile);
            const fileName = path.basename(workspaceFile);

            await vscode.commands.executeCommand('vscode.diff',
                storedUri,
                workspaceUri,
                `${fileName} (Metadata Diff)`
            );
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                error as string,
                error as Error
            );
            vscode.window.showErrorMessage("Failed to open diff view");
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.clearView", async () => {
        try {
            MetadataDiffDesktop.resetTreeView();

            // Set the context variable to false to show welcome message
            await vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiff.hasData", false);

            // Reload tree data provider to show welcome message
            const treeDataProvider = MetadataDiffTreeDataProvider.initialize(context);
            context.subscriptions.push(
                vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.metadataDiff", treeDataProvider)
            );

            vscode.window.showInformationMessage("Metadata diff view cleared successfully.");
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                error as string,
                error as Error
            );
            vscode.window.showErrorMessage("Failed to clear metadata diff view");
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.triggerFlowWithSite", async (websiteId: string) => {
        try {
            // Get the PAC wrapper to access org list
            const pacWrapper = pacTerminal.getWrapper();

            // Get current org info instead of prompting user
            const pacActiveOrg = await pacWrapper.activeOrg();
            if (!pacActiveOrg || pacActiveOrg.Status !== SUCCESS) {
                vscode.window.showErrorMessage("No active environment found. Please authenticate first.");
                return;
            }

            const orgUrl = pacActiveOrg.Results.OrgUrl;
            if (!orgUrl) {
                vscode.window.showErrorMessage("Current environment URL not found.");
                return;
            }

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage("No folders opened in the current workspace.");
                return;
            }

            const storagePath = context.storageUri?.fsPath;
            if (!storagePath) {
                throw new Error("Storage path is not defined");
            }

            // Clean out any existing files in storagePath (so we have a "fresh" download)
            if (fs.existsSync(storagePath)) {
                fs.rmSync(storagePath, { recursive: true, force: true });
            }
            fs.mkdirSync(storagePath, { recursive: true });

            const progressOptions: vscode.ProgressOptions = {
                location: vscode.ProgressLocation.Notification,
                title: "Downloading website metadata",
                cancellable: false
            };

            let pacPagesDownload;
            await vscode.window.withProgress(progressOptions, async (progress) => {
                progress.report({ message: "Looking for this website in the connected environment..." });
                const pacPagesList = await MetadataDiffDesktop.getPagesList(pacTerminal);
                if (pacPagesList && pacPagesList.length > 0) {
                    const websiteRecord = pacPagesList.find((record) => record.id === websiteId);
                    if (!websiteRecord) {
                        vscode.window.showErrorMessage("Website not found in the connected environment.");
                        return;
                    }
                    progress.report({ message: `Downloading "${websiteRecord.name}" as ${websiteRecord.modelVersion === "v2" ? "enhanced" : "standard"} data model. Please wait...` });
                    pacPagesDownload = await pacWrapper.pagesDownload(storagePath, websiteId, websiteRecord.modelVersion == "v1" ? "1" : "2");
                    vscode.window.showInformationMessage("Download completed.");
                }
            });

            if (pacPagesDownload) {
                const treeDataProvider = MetadataDiffTreeDataProvider.initialize(context);
                context.subscriptions.push(
                    vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.metadataDiff", treeDataProvider)
                );
            } else {
                vscode.window.showErrorMessage("Failed to download metadata.");
            }

        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_REFRESH_FAILED, error as string, error as Error, { methodName: null }, {});
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.triggerFlow", async () => {
        try {
            // Get the PAC wrapper to access org list
            const pacWrapper = pacTerminal.getWrapper();

            let orgUrl: string | undefined;

            // Get list of available organizations
            const orgListResult = await pacWrapper.orgList();

            if (orgListResult && orgListResult.Status === SUCCESS && orgListResult.Results.length > 0) {
                // Create items for QuickPick
                const items = orgListResult.Results.map(org => {
                    return {
                        label: org.FriendlyName,
                        description: org.EnvironmentUrl,
                        detail: `${org.OrganizationId} (${org.EnvironmentId})`
                    };
                });

                // Add option to enter URL manually
                items.push({
                    label: "$(plus) Enter organization URL manually",
                    description: "",
                    detail: "Enter a custom organization URL"
                });

                // Show QuickPick to select environment
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: "Select an environment or enter URL manually",
                    ignoreFocusOut: true
                });

                if (selected) {
                    if (selected.description) {
                        // Use the selected org URL
                        orgUrl = selected.description;
                    } else {
                        // If manual entry option was selected
                        orgUrl = await vscode.window.showInputBox({
                            prompt: "Enter the organization URL",
                            placeHolder: "https://your-org.crm.dynamics.com",
                            validateInput: (input) => {
                                const urlPattern = /^https:\/\/[a-zA-Z0-9.-]+\d*\.crm\.dynamics\.com\/?$/;
                                return urlPattern.test(input) ? null : "Please enter a valid URL in the format: https://your-org.crm.dynamics.com";
                            }
                        });
                    }
                }
            } else {
                // Fallback to manual entry if no orgs are found
                orgUrl = await vscode.window.showInputBox({
                    prompt: "Enter the organization URL",
                    placeHolder: "https://your-org.crm.dynamics.com"
                });
            }

            if (!orgUrl) {
                vscode.window.showErrorMessage("Organization URL is required to trigger the metadata diff flow.");
                return;
            }

            const urlPattern = /^https:\/\/[a-zA-Z0-9.-]+\d*\.crm\.dynamics\.com\/?$/;
            if (!urlPattern.test(orgUrl)) {
                vscode.window.showErrorMessage("Invalid organization URL. Please enter a valid URL in the format: https://your-org.crm.dynamics.com", { modal: true });
                return;
            }

            const pacActiveOrg = await pacWrapper.activeOrg();
            if(pacActiveOrg){
                if (pacActiveOrg.Status === SUCCESS) {
                    if(pacActiveOrg.Results.OrgUrl == orgUrl){
                        vscode.window.showInformationMessage("Already connected to the specified environment.");
                    }
                    else{
                        const pacOrgSelect = await pacWrapper.orgSelect(orgUrl);
                        if(pacOrgSelect && pacOrgSelect.Status === SUCCESS){
                            vscode.window.showInformationMessage("Environment switched successfully.");
                        }
                        else{
                            vscode.window.showErrorMessage("Failed to switch the environment.");
                            return;
                        }
                    }
                }
                else{
                    await createAuthProfileExp(pacWrapper, orgUrl);
                    vscode.window.showInformationMessage("Auth profile created successfully.");
                }
            }
            else {
                vscode.window.showErrorMessage("Failed to fetch the current environment details.");
                return;
            }

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage("No folders opened in the current workspace.");
                return;
            }

            const currentWorkspaceFolder = workspaceFolders[0].uri.fsPath;
            const websiteId = getWebsiteRecordId(currentWorkspaceFolder);
            path.join(websiteId, "metadataDiffStorage");
            const storagePath = context.storageUri?.fsPath;
            if (!storagePath) {
                throw new Error("Storage path is not defined");
            }

            // Clean out any existing files in storagePath (so we have a "fresh" download)
            if (fs.existsSync(storagePath)) {
                fs.rmSync(storagePath, { recursive: true, force: true });
            }
            fs.mkdirSync(storagePath, { recursive: true });
            const progressOptions: vscode.ProgressOptions = {
                location: vscode.ProgressLocation.Notification,
                title: "Downloading website metadata",
                cancellable: false
            };
            let pacPagesDownload;
            await vscode.window.withProgress(progressOptions, async (progress) => {
                progress.report({ message: "Looking for this website in the connected environment..." });
                const pacPagesList = await MetadataDiffDesktop.getPagesList(pacTerminal);
                if (pacPagesList && pacPagesList.length > 0) {
                    const websiteRecord = pacPagesList.find((record) => record.id === websiteId);
                    if (!websiteRecord) {
                        vscode.window.showErrorMessage("Website not found in the connected environment.");
                        return;
                    }
                    progress.report({ message: `Downloading "${websiteRecord.name}" as ${websiteRecord.modelVersion === "v2" ? "enhanced" : "standard"} data model. Please wait...` });
                    pacPagesDownload = await pacWrapper.pagesDownload(storagePath, websiteId, websiteRecord.modelVersion == "v1" ? "1" : "2");
                    vscode.window.showInformationMessage("Download completed.");
                }
            });
            if (pacPagesDownload) {
                const treeDataProvider = MetadataDiffTreeDataProvider.initialize(context);
                context.subscriptions.push(
                    vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.metadataDiff", treeDataProvider)
                );
            }
            else{
                vscode.window.showErrorMessage("Failed to download metadata.");
            }

        }
        catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_REFRESH_FAILED, error as string, error as Error, { methodName: null }, {});
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.generateReport", async () => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage("No workspace folder open");
                return;
            }

            const storagePath = context.storageUri?.fsPath;
            if (!storagePath) {
                vscode.window.showErrorMessage("Storage path not found");
                return;
            }

            // Generate report content
            const reportContent = await generateDiffReport(workspaceFolders[0].uri.fsPath, storagePath);

            // Create the markdown document
            const doc = await vscode.workspace.openTextDocument({
                content: reportContent,
                language: 'markdown'
            });

            // Show the document in column One
            await vscode.window.showTextDocument(doc, {
                preview: false,  // Don't use preview mode to ensure stability
                viewColumn: vscode.ViewColumn.One,
                preserveFocus: false // Ensure focus is on the document
            });

            // Increase delay to ensure document is fully loaded and stable
            await new Promise(resolve => setTimeout(resolve, 800));

            // Close any existing preview first to avoid conflicts
            await vscode.commands.executeCommand('markdown.preview.refresh');

            // Show preview in side-by-side mode
            await vscode.commands.executeCommand('markdown.showPreviewToSide');

        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                error as string,
                error as Error
            );
            vscode.window.showErrorMessage("Failed to generate metadata diff report");
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.exportReport", async () => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage("No workspace folder open");
                return;
            }

            const storagePath = context.storageUri?.fsPath;
            if (!storagePath) {
                vscode.window.showErrorMessage("Storage path not found");
                return;
            }

            // Get diff files
            const diffFiles = await getAllDiffFiles(workspaceFolders[0].uri.fsPath, storagePath);

            // Create report object
            const report: MetadataDiffReport = {
                generatedOn: new Date().toISOString(),
                files: diffFiles
            };

            // Save dialog
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file('metadata-diff-report.json'),
                filters: {
                    'JSON files': ['json']
                }
            });

            if (saveUri) {
                fs.writeFileSync(saveUri.fsPath, JSON.stringify(report, null, 2));
                vscode.window.showInformationMessage("Report exported successfully");
            }
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                error as string,
                error as Error
            );
            vscode.window.showErrorMessage("Failed to export metadata diff report");
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.importReport", async () => {
        try {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'JSON files': ['json']
                }
            });

            if (fileUri && fileUri[0]) {
                const reportContent = fs.readFileSync(fileUri[0].fsPath, 'utf8');
                const report = JSON.parse(reportContent) as MetadataDiffReport;

                // Clean up any existing tree data provider
                const treeDataProvider = new MetadataDiffTreeDataProvider(context);

                // Update the tree with imported data
                await treeDataProvider.setDiffFiles(report.files);

                // Register the new tree data provider
                context.subscriptions.push(
                    vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.metadataDiff", treeDataProvider)
                );

                vscode.window.showInformationMessage("Report imported successfully");
            }
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                error as string,
                error as Error
            );
            vscode.window.showErrorMessage("Failed to import metadata diff report");
        }
    });
}
