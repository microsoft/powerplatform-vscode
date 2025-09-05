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
import { MetadataDiffDesktop } from "./MetadataDiffDesktop";
import { ActionsHubTreeDataProvider } from "../actions-hub/ActionsHubTreeDataProvider";
import { createAuthProfileExp } from "../../../common/utilities/PacAuthUtil";
import { getWebsiteRecordId } from "../../../common/utilities/WorkspaceInfoFinderUtil";
// Duplicate imports removed
import { generateDiffReport, getAllDiffFiles, MetadataDiffReport } from "./MetadataDiffUtils";
import { getMetadataDiffBaseEventInfo } from "./MetadataDiffTelemetry";
import { buildComparison, ensureActiveOrg, resetDirectory, toModelVersion } from "./MetadataDiffHelpers";

export async function registerMetadataDiffCommands(context: vscode.ExtensionContext, pacTerminal: PacTerminal): Promise<void> {
    // Register command for handling file diffs
    vscode.commands.registerCommand('metadataDiff.openDiff', async (workspaceFile?: string, storedFile?: string) => {
        try {
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_OPEN_DIFF_CALLED, { ...getMetadataDiffBaseEventInfo(), hasWorkspace: !!workspaceFile, hasStored: !!storedFile });
            if (!workspaceFile && !storedFile) {
                return;
            }

            // Determine scenario:
            // Added locally: workspaceFile only
            // Removed locally: storedFile only
            // Modified: both files
            const addedLocally = !!workspaceFile && !storedFile;
            const removedLocally = !!storedFile && !workspaceFile;

            // Build URIs (use virtual empty doc for missing side)
            const makeEmptyUri = (label: string) => vscode.Uri.parse(`untitled:__metadata_diff__/${label}`);

            let leftUri: vscode.Uri;
            let rightUri: vscode.Uri;
            let titleBase: string;

            if (addedLocally) {
                // Show empty (environment) on left, local on right
                leftUri = makeEmptyUri('environment');
                rightUri = vscode.Uri.file(workspaceFile!);
                titleBase = path.basename(workspaceFile!);
            } else if (removedLocally) {
                // Show environment file on left, empty on right
                leftUri = vscode.Uri.file(storedFile!);
                rightUri = makeEmptyUri('local');
                titleBase = path.basename(storedFile!);
            } else {
                leftUri = vscode.Uri.file(storedFile!);
                rightUri = vscode.Uri.file(workspaceFile!);
                titleBase = path.basename(workspaceFile!);
            }

            // If an empty side, ensure a document is opened (untitled) so diff API works consistently
            if (addedLocally) {
                await vscode.workspace.openTextDocument(leftUri).then(doc => {
                    if (doc.getText().length === 0) {
                        // no edit needed, blank
                    }
                });
            } else if (removedLocally) {
                await vscode.workspace.openTextDocument(rightUri).then(doc => {
                    if (doc.getText().length === 0) {
                        // blank
                    }
                });
            }

            const title = `${titleBase} (Local ↔ Environment)`;
            await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, title, {
                preview: true
            });
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_OPEN_DIFF_SUCCEEDED, { ...getMetadataDiffBaseEventInfo(), diffType: addedLocally ? 'onlyLocal' : removedLocally ? 'onlyEnvironment' : 'modified', fileName: titleBase });
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_OPEN_DIFF_FAILED,
                error as string,
                error as Error
            );
            vscode.window.showErrorMessage("Failed to open diff view");
        }
    });

    // Explicit alias command shown in context menu (kept separate for clearer telemetry / labeling)
    vscode.commands.registerCommand('metadataDiff.openComparison', async (itemOrWorkspace?: unknown, maybeStored?: unknown) => {
        // Support invocation with either (workspace, stored) or a single tree item
        let workspaceFile: string | undefined;
        let storedFile: string | undefined;
        if (typeof itemOrWorkspace === 'string') {
            workspaceFile = itemOrWorkspace;
            storedFile = typeof maybeStored === 'string' ? maybeStored : undefined;
        } else if (itemOrWorkspace && typeof itemOrWorkspace === 'object') {
            // Attempt to read wrapper properties
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obj: any = itemOrWorkspace;
            workspaceFile = obj.filePath || obj.workspaceFile;
            storedFile = obj.storedFilePath || obj.storageFile;
        }
        if (workspaceFile || storedFile) {
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_OPEN_COMPARISON_CALLED, { ...getMetadataDiffBaseEventInfo(), hasWorkspace: !!workspaceFile, hasStored: !!storedFile });
            await vscode.commands.executeCommand('metadataDiff.openDiff', workspaceFile, storedFile);
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_OPEN_COMPARISON_SUCCEEDED, { ...getMetadataDiffBaseEventInfo() });
        } else {
            vscode.window.showWarningMessage(vscode.l10n.t('Unable to open comparison for this item.'));
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_OPEN_COMPARISON_FAILED, { ...getMetadataDiffBaseEventInfo(), reason: 'noWorkspaceOrStored' });
        }
    });

    // Discard local changes => overwrite workspace file with stored (remote) version
    vscode.commands.registerCommand('metadataDiff.discardLocalChanges', async (itemOrWorkspace?: unknown, maybeStored?: unknown) => {
        try {
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_DISCARD_LOCAL_CALLED, { ...getMetadataDiffBaseEventInfo() });
            let workspaceFile: string | undefined;
            let storedFile: string | undefined;
            if (typeof itemOrWorkspace === 'string') {
                workspaceFile = itemOrWorkspace;
                storedFile = typeof maybeStored === 'string' ? maybeStored : undefined;
            } else if (itemOrWorkspace && typeof itemOrWorkspace === 'object') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const obj: any = itemOrWorkspace;
                workspaceFile = obj.filePath || obj.workspaceFile;
                storedFile = obj.storedFilePath || obj.storageFile;
            }
            if (!workspaceFile || !storedFile) {
                vscode.window.showWarningMessage('Unable to discard changes for this item.');
                return;
            }
            const confirm = await vscode.window.showWarningMessage(
                vscode.l10n.t('Discard local changes to "{0}"? This will overwrite the local file with the server copy.', path.basename(workspaceFile)),
                { modal: true },
                vscode.l10n.t('Discard')
            );
            if (confirm !== vscode.l10n.t('Discard')) {
                return;
            }
            const remoteContent = fs.readFileSync(storedFile, 'utf8');
            fs.writeFileSync(workspaceFile, remoteContent, 'utf8');
            // Show a diff after discard for confirmation (optional) or simply info message
            vscode.window.showInformationMessage(vscode.l10n.t('Local changes discarded for "{0}".', path.basename(workspaceFile)));
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_DISCARD_LOCAL_SUCCEEDED, { ...getMetadataDiffBaseEventInfo(), fileName: path.basename(workspaceFile) });
            // Re-run diff provider to update statuses (file should now be identical and removed from diff view)
            const provider = MetadataDiffDesktop['_treeDataProvider'] as MetadataDiffTreeDataProvider | undefined; // best-effort access
            if (provider) {
                // Invalidate cached diff items without wiping remote storage directory
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const providerAny: any = provider;
                if (providerAny._diffItems) {
                    providerAny._diffItems = [];
                }
                await provider.getChildren();
            }
            vscode.commands.executeCommand('microsoft.powerplatform.pages.actionsHub.refresh');
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_DISCARD_LOCAL_FAILED, error as string, error as Error, { ...getMetadataDiffBaseEventInfo() }, {});
            vscode.window.showErrorMessage('Failed to discard local changes');
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.resync", async () => {
        try {
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_RESYNC_CALLED, { ...getMetadataDiffBaseEventInfo() });
            if (!(await ensureActiveOrg(pacTerminal))) return;
            MetadataDiffDesktop.resetTreeView();
            const folders = vscode.workspace.workspaceFolders;
            if (!folders) return;
            const websiteId = getWebsiteRecordId(folders[0].uri.fsPath);
            if (!websiteId) { vscode.window.showErrorMessage(vscode.l10n.t("Unable to determine website id from workspace.")); return; }
            const result = await buildComparison(context, pacTerminal, websiteId, vscode.l10n.t("Re-syncing website metadata"), "resync");
            if (result.success) {
                vscode.window.showInformationMessage(vscode.l10n.t("You can now view the comparison"));
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_RESYNC_SUCCEEDED, { ...getMetadataDiffBaseEventInfo() });
            } else {
                vscode.window.showErrorMessage(vscode.l10n.t("Failed to re-sync metadata."));
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_RESYNC_FAILED, { ...getMetadataDiffBaseEventInfo() });
            }
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_RESYNC_FAILED, error as string, error as Error, { ...getMetadataDiffBaseEventInfo() }, {});
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.clearView", async () => {
        try {
            MetadataDiffDesktop.resetTreeView();

            // Set the context variable to false to show welcome message
            await vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiff.hasData", false);

            // Reload tree data provider to show welcome message
            // Reinitialize provider and update Actions Hub root
            MetadataDiffTreeDataProvider.initialize(context);
            vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");

            vscode.window.showInformationMessage("Metadata diff view cleared successfully.");
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_CLEAR_SUCCEEDED, { ...getMetadataDiffBaseEventInfo() });
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
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_TRIGGER_FLOW_WITH_SITE_CALLED, { ...getMetadataDiffBaseEventInfo(), websiteId });
            if (!(await ensureActiveOrg(pacTerminal))) return;
            const result = await buildComparison(context, pacTerminal, websiteId, vscode.l10n.t("Downloading website metadata"), "triggerFlowWithSite");
            if (result.success) {
                vscode.window.showInformationMessage(vscode.l10n.t("You can now view the comparison"));
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_TRIGGER_FLOW_WITH_SITE_SUCCEEDED, { ...getMetadataDiffBaseEventInfo(), websiteId });
            } else {
                vscode.window.showErrorMessage(vscode.l10n.t("Failed to download metadata."));
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_TRIGGER_FLOW_WITH_SITE_FAILED, { ...getMetadataDiffBaseEventInfo(), websiteId });
            }
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_TRIGGER_FLOW_WITH_SITE_FAILED, error as string, error as Error, { ...getMetadataDiffBaseEventInfo(), websiteId }, {});
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.triggerFlow", async () => {
        try {
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_TRIGGER_FLOW_CALLED, { ...getMetadataDiffBaseEventInfo() });
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

            const folders = vscode.workspace.workspaceFolders;
            if (!folders) { vscode.window.showErrorMessage(vscode.l10n.t("No folders opened in the current workspace.")); return; }
            const websiteId = getWebsiteRecordId(folders[0].uri.fsPath);
            if (!websiteId) { vscode.window.showErrorMessage(vscode.l10n.t("Unable to determine website id from workspace.")); return; }
            const result = await buildComparison(context, pacTerminal, websiteId, vscode.l10n.t("Downloading website metadata"), "triggerFlow");
            if (result.success) {
                vscode.window.showInformationMessage(vscode.l10n.t("You can now view the comparison"));
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_TRIGGER_FLOW_SUCCEEDED, { ...getMetadataDiffBaseEventInfo() });
            } else {
                vscode.window.showErrorMessage(vscode.l10n.t("Failed to download metadata."));
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_TRIGGER_FLOW_FAILED, { ...getMetadataDiffBaseEventInfo() });
            }

        }
        catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_TRIGGER_FLOW_FAILED, error as string, error as Error, { ...getMetadataDiffBaseEventInfo() }, {});
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.generateReport", async () => {
        try {
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_REPORT_GENERATE_CALLED, { ...getMetadataDiffBaseEventInfo() });
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

            // Generate HTML report (was Markdown previously)
            const htmlReport = await generateDiffReport(workspaceFolders[0].uri.fsPath, storagePath);

            // Open source view (HTML) – helpful if user wants to copy/export.
            const doc = await vscode.workspace.openTextDocument({
                content: htmlReport,
                language: 'html'
            });
            await vscode.window.showTextDocument(doc, {
                preview: false,
                viewColumn: vscode.ViewColumn.One,
                preserveFocus: false
            });

            // Create / reveal webview preview side-by-side
            const panel = vscode.window.createWebviewPanel(
                'metadataDiffReportPreview',
                'Power Pages Metadata Diff Report',
                { viewColumn: vscode.ViewColumn.Two, preserveFocus: true },
                { enableScripts: true } // no scripts currently, but allow future enhancements
            );
            panel.webview.html = htmlReport;
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_REPORT_GENERATE_SUCCEEDED, { ...getMetadataDiffBaseEventInfo(), htmlLength: htmlReport.length });
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_REPORT_GENERATE_FAILED,
                error as string,
                error as Error
            );
            vscode.window.showErrorMessage("Failed to generate metadata diff report");
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.exportReport", async () => {
        try {
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_REPORT_EXPORT_CALLED, { ...getMetadataDiffBaseEventInfo() });
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
                const json = JSON.stringify(report, null, 2);
                fs.writeFileSync(saveUri.fsPath, json);
                vscode.window.showInformationMessage("Report exported successfully");
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_REPORT_EXPORT_SUCCEEDED, { ...getMetadataDiffBaseEventInfo(), fileCount: diffFiles.length, exportSizeBytes: json.length });
            }
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_REPORT_EXPORT_FAILED,
                error as string,
                error as Error
            );
            vscode.window.showErrorMessage("Failed to export metadata diff report");
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.importReport", async () => {
        try {
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_REPORT_IMPORT_CALLED, { ...getMetadataDiffBaseEventInfo() });
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
                await treeDataProvider.setDiffFiles(report.files); // triggers refresh
                vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");

                vscode.window.showInformationMessage("Report imported successfully");
                oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_REPORT_IMPORT_SUCCEEDED, { ...getMetadataDiffBaseEventInfo(), fileCount: report.files.length });
            }
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_REPORT_IMPORT_FAILED,
                error as string,
                error as Error
            );
            vscode.window.showErrorMessage("Failed to import metadata diff report");
        }
    });
}
