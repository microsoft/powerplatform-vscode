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
import { fetchWebsites } from "../actions-hub/ActionsHubCommandHandlers";
import { WebsiteDataModel } from "../../../common/services/Constants";
import { IWebsiteDetails } from "../../../common/services/Interfaces";
import { createAuthProfileExp } from "../../../common/utilities/PacAuthUtil";
import { getWebsiteRecordId } from "../../../common/utilities/WorkspaceInfoFinderUtil";
import { generateDiffReport, getAllDiffFiles, MetadataDiffReport } from "./MetadataDiffUtils";
import { getBaseEventInfo } from "../actions-hub/TelemetryHelper";

// ---------------- Helper Functions (internal) ----------------
function getWorkspaceAndWebsiteId(): { workspacePath: string, websiteId: string } | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No folders opened in the current workspace.");
        return undefined;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const websiteId = getWebsiteRecordId(workspacePath);
    if (!websiteId) {
        vscode.window.showErrorMessage("Unable to determine website id from workspace.");
        return undefined;
    }
    return { workspacePath, websiteId };
}

function recreateStorageDirectory(storagePath: string | undefined): string | undefined {
    if (!storagePath) {
        vscode.window.showErrorMessage("Storage path not found");
        return undefined;
    }
    try {
        if (fs.existsSync(storagePath)) {
            fs.rmSync(storagePath, { recursive: true, force: true });
        }
        fs.mkdirSync(storagePath, { recursive: true });
        return storagePath;
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError("MetadataDiffStoragePrepFailed", (error as Error).message, error as Error);
        vscode.window.showErrorMessage("Failed to prepare storage directory");
        return undefined;
    }
}

function findSite(websiteId: string, active: IWebsiteDetails[], inactive: IWebsiteDetails[]): IWebsiteDetails | undefined {
    const lower = websiteId.toLowerCase();
    return [...active, ...inactive].find(s => s.websiteRecordId.toLowerCase() === lower);
}

async function initProviderAndRefresh(context: vscode.ExtensionContext): Promise<void> {
    const provider = MetadataDiffTreeDataProvider.initialize(context);
    MetadataDiffDesktop.setTreeDataProvider(provider);
    ActionsHubTreeDataProvider.setMetadataDiffProvider(provider);
    await provider.getChildren();
    vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");
}

async function executeDiffWorkflow(
    context: vscode.ExtensionContext,
    pacTerminal: PacTerminal,
    websiteId: string,
    progressTitle: string
): Promise<boolean> {
    const storagePath = recreateStorageDirectory(context.storageUri?.fsPath);
    if (!storagePath) { return false; }
    const pacWrapper = pacTerminal.getWrapper();
    let success = false;
    const progressOptions: vscode.ProgressOptions = { location: vscode.ProgressLocation.Notification, title: progressTitle, cancellable: false };
    await vscode.window.withProgress(progressOptions, async (progress) => {
        progress.report({ message: "Looking for this website in the connected environment..." });
        const websites = await fetchWebsites();
        const site = findSite(websiteId, websites.activeSites, websites.inactiveSites);
        if (!site) {
            vscode.window.showErrorMessage("Website not found in the connected environment.");
            return;
        }
        const modelVersion: 1 | 2 = site.dataModel === WebsiteDataModel.Standard ? 1 : 2;
        progress.report({ message: vscode.l10n.t('Retrieving "{0}" as {1} data model. Please wait...', site.name, modelVersion === 2 ? 'enhanced' : 'standard') });
        const download = await pacWrapper.downloadSite(storagePath, websiteId, modelVersion);
        if (!download) { return; }
        progress.report({ message: vscode.l10n.t('Comparing metadata of "{0}"...', site.name) });
        await initProviderAndRefresh(context);
        success = true;
    });
    return success;
}

// Exported for tests to exercise discard logic without needing command registration
export async function performDiscard(
    context: vscode.ExtensionContext,
    itemOrWorkspace?: unknown,
    maybeStored?: unknown
): Promise<{ actionType?: 'overwrite' | 'delete' | 'materialize' } | undefined> {
    let workspaceFile: string | undefined;
    let storedFile: string | undefined;
    let relativePath: string | undefined;
    if (typeof itemOrWorkspace === 'string') {
        workspaceFile = itemOrWorkspace;
        storedFile = typeof maybeStored === 'string' ? maybeStored : undefined;
    } else if (itemOrWorkspace && typeof itemOrWorkspace === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = itemOrWorkspace;
        workspaceFile = obj.filePath || obj.workspaceFile;
        storedFile = obj.storedFilePath || obj.storageFile;
        relativePath = obj.relativePath;
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspaceRoot = workspaceFolders && workspaceFolders.length ? workspaceFolders[0].uri.fsPath : undefined;
    let actionType: 'overwrite' | 'delete' | 'materialize' | undefined;

    if (workspaceFile && storedFile) {
        const confirm = await vscode.window.showWarningMessage(
            vscode.l10n.t('Discard local changes to "{0}"? This will overwrite the local file with the environment copy.', path.basename(workspaceFile)),
            { modal: true },
            vscode.l10n.t('Discard')
        );
        if (confirm !== vscode.l10n.t('Discard')) { return; }
        const remoteContent = fs.readFileSync(storedFile, 'utf8');
        fs.writeFileSync(workspaceFile, remoteContent, 'utf8');
        vscode.window.showInformationMessage(vscode.l10n.t('Local changes discarded for "{0}".', path.basename(workspaceFile)));
        actionType = 'overwrite';
    } else if (workspaceFile && !storedFile) {
        const confirm = await vscode.window.showWarningMessage(
            vscode.l10n.t('Delete local file "{0}"? (It does not exist in the environment)', path.basename(workspaceFile)),
            { modal: true },
            vscode.l10n.t('Delete')
        );
        if (confirm !== vscode.l10n.t('Delete')) { return; }
        if (fs.existsSync(workspaceFile)) {
            fs.unlinkSync(workspaceFile);
        }
        vscode.window.showInformationMessage(vscode.l10n.t('Local file "{0}" deleted.', path.basename(workspaceFile)));
        actionType = 'delete';
    } else if (!workspaceFile && storedFile && workspaceRoot) {
        let targetRelative = relativePath;
        if (!targetRelative) {
            const storageRoot = context.storageUri?.fsPath;
            if (storageRoot) {
                try {
                    if (storedFile.startsWith(storageRoot)) {
                        const remainder = storedFile.substring(storageRoot.length).replace(/^\\|\//, '');
                        const parts = remainder.split(/\\|\//).filter(p => !!p);
                        if (parts.length > 1) {
                            targetRelative = parts.slice(1).join('/');
                        }
                    }
                } catch { /* ignore */ }
            }
        }
        if (!targetRelative) {
            vscode.window.showWarningMessage(vscode.l10n.t('Unable to materialize environment file locally (path resolution failed).'));
            return;
        }
        const targetPath = path.join(workspaceRoot, targetRelative);
        const confirm = await vscode.window.showWarningMessage(
            vscode.l10n.t('Create local copy of environment file "{0}"?', targetRelative),
            { modal: true },
            vscode.l10n.t('Create')
        );
        if (confirm !== vscode.l10n.t('Create')) { return; }
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        const remoteContent = fs.readFileSync(storedFile, 'utf8');
        fs.writeFileSync(targetPath, remoteContent, 'utf8');
        vscode.window.showInformationMessage(vscode.l10n.t('Environment file "{0}" created locally.', targetRelative));
        actionType = 'materialize';
    } else {
        vscode.window.showWarningMessage(vscode.l10n.t('Unable to process discard action for this item.'));
        return;
    }

    const provider = MetadataDiffDesktop['_treeDataProvider'] as MetadataDiffTreeDataProvider | undefined;
    if (provider) {
        await provider.recomputeDiff();
    } else {
        vscode.commands.executeCommand('microsoft.powerplatform.pages.actionsHub.refresh');
    }
    return { actionType };
}

export async function registerMetadataDiffCommands(context: vscode.ExtensionContext, pacTerminal: PacTerminal): Promise<void> {
    vscode.commands.registerCommand('microsoft.powerplatform.pages.metadataDiff.openDiff', async (workspaceFile?: string, storedFile?: string) => {
        oneDSLoggerWrapper.getLogger().traceInfo(
            Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
            { command: 'openDiff', hasWorkspaceFile: !!workspaceFile, hasStoredFile: !!storedFile, ...getBaseEventInfo() }
        );
        try {
            if (!workspaceFile && !storedFile) {
                vscode.window.showWarningMessage(vscode.l10n.t("No file paths provided for diff."));
                return;
            }

            const tempRoot = path.join(context.storageUri?.fsPath || '', 'tempDiff');
            if (!fs.existsSync(tempRoot)) {
                fs.mkdirSync(tempRoot, { recursive: true });
            }

            const makeEmptySide = (basename: string, suffix: string) => {
                const emptyPath = path.join(tempRoot, `${basename}.${suffix}.empty`);
                if (!fs.existsSync(emptyPath)) {
                    fs.writeFileSync(emptyPath, '');
                }
                return emptyPath;
            };

            let leftUri: vscode.Uri;
            let rightUri: vscode.Uri;
            let title: string;

            if (workspaceFile && storedFile) {
                leftUri = vscode.Uri.file(storedFile);
                rightUri = vscode.Uri.file(workspaceFile);
                title = vscode.l10n.t('{0} (Modified)', path.basename(workspaceFile));
            } else if (workspaceFile && !storedFile) {
                const base = path.basename(workspaceFile);
                const emptyPath = makeEmptySide(base, 'env');
                leftUri = vscode.Uri.file(emptyPath);
                rightUri = vscode.Uri.file(workspaceFile);
                title = vscode.l10n.t('{0} (Only in Local)', base);
            } else {
                const base = path.basename(storedFile!);
                const emptyPath = makeEmptySide(base, 'local');
                leftUri = vscode.Uri.file(storedFile!);
                rightUri = vscode.Uri.file(emptyPath);
                title = vscode.l10n.t('{0} (Only in Environment)', base);
            }

            await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, title);
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                error as string,
                error as Error
            );
            vscode.window.showErrorMessage('Failed to open diff view');
        }
    });

    vscode.commands.registerCommand('microsoft.powerplatform.pages.metadataDiff.openComparison', async (itemOrWorkspace?: unknown, maybeStored?: unknown) => {
        oneDSLoggerWrapper.getLogger().traceInfo(
            Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
            { command: 'openComparison', argType: typeof itemOrWorkspace, ...getBaseEventInfo() }
        );
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
        // Allow opening for added / removed as well (one-sided)
        if (workspaceFile || storedFile) {
            await vscode.commands.executeCommand('microsoft.powerplatform.pages.metadataDiff.openDiff', workspaceFile, storedFile);
        } else {
            vscode.window.showWarningMessage(vscode.l10n.t("Unable to open comparison for this item."));
        }
    });

    // Helper that performs discard logic and returns actionType for telemetry.
    function registerDiscardCommand(commandId: string) {
        vscode.commands.registerCommand(commandId, async (itemOrWorkspace?: unknown, maybeStored?: unknown) => {
            oneDSLoggerWrapper.getLogger().traceInfo(
                Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
                { command: commandId.split('.').slice(-1)[0], variantCommandId: commandId, phase: 'start', ...getBaseEventInfo() }
            );
            try {
                const result = await performDiscard(context, itemOrWorkspace, maybeStored);
                if (result?.actionType) {
                    oneDSLoggerWrapper.getLogger().traceInfo(
                        Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
                        { command: 'discardLocalChanges', variantCommandId: commandId, actionType: result.actionType, phase: 'completed', ...getBaseEventInfo() }
                    );
                }
            } catch (error) {
                oneDSLoggerWrapper.getLogger().traceError(
                    Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                    error as string,
                    error as Error
                );
                vscode.window.showErrorMessage('Failed to discard local changes');
            }
        });
    }

    // Base (legacy) command id retained for compatibility, plus contextual variants.
    registerDiscardCommand('microsoft.powerplatform.pages.metadataDiff.discardLocalChanges');
    registerDiscardCommand('microsoft.powerplatform.pages.metadataDiff.discardLocalChanges.modified');
    registerDiscardCommand('microsoft.powerplatform.pages.metadataDiff.discardLocalChanges.deleteLocal');
    registerDiscardCommand('microsoft.powerplatform.pages.metadataDiff.discardLocalChanges.materialize');

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.resync", async () => {
        oneDSLoggerWrapper.getLogger().traceInfo(
            Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
            { command: 'resync', ...getBaseEventInfo() }
        );
        try {
            // Only proceed if we already have data (context set by menu 'when' clause)
            const pacWrapper = pacTerminal.getWrapper();
            const pacActiveOrg = await pacWrapper.activeOrg();
            if (!pacActiveOrg || pacActiveOrg.Status !== SUCCESS) {
                vscode.window.showErrorMessage("No active environment found. Please authenticate first.");
                return;
            }
            MetadataDiffDesktop.resetTreeView();
            const ws = getWorkspaceAndWebsiteId();
            if (!ws) { return; }
            const success = await executeDiffWorkflow(context, pacTerminal, ws.websiteId, vscode.l10n.t("Re-syncing website metadata"));
            if (success) {
                vscode.window.showInformationMessage(vscode.l10n.t("You can now view the comparison"));
            } else {
                vscode.window.showErrorMessage("Failed to re-sync metadata.");
            }
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_REFRESH_FAILED, error as string, error as Error, { methodName: null }, {});
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.clearView", async () => {
        oneDSLoggerWrapper.getLogger().traceInfo(
            Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
            { command: 'clearView', ...getBaseEventInfo() }
        );
        try {
            MetadataDiffDesktop.resetTreeView();

            // Set the context variable to false to show welcome message
            await vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiff.hasData", false);

            // Reload tree data provider to show welcome message
            // Reinitialize provider and update Actions Hub root
            MetadataDiffTreeDataProvider.initialize(context);
            vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");

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

    // Accept either a raw websiteId (string) or a SiteTreeItem / object carrying siteInfo.websiteId
    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.triggerFlowWithSite", async (arg?: unknown) => {
        oneDSLoggerWrapper.getLogger().traceInfo(
            Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
            { command: 'triggerFlowWithSite', argType: typeof arg, ...getBaseEventInfo() }
        );
        try {
            // Normalize input to websiteId
            let websiteId: string | undefined;
            if (typeof arg === 'string') {
                websiteId = arg;
            } else if (arg && typeof arg === 'object') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyArg: any = arg;
                websiteId = anyArg?.siteInfo?.websiteId || anyArg?.websiteId || anyArg?.id || undefined;
            }

            if (!websiteId) {
                vscode.window.showErrorMessage("Website id not provided from context.");
                return;
            }
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

            const ws = getWorkspaceAndWebsiteId();
            if (!ws) { return; }
            const success = await executeDiffWorkflow(context, pacTerminal, websiteId, vscode.l10n.t("Downloading website metadata"));
            if (success) {
                vscode.window.showInformationMessage(vscode.l10n.t("You can now view the comparison"));
            } else {
                vscode.window.showErrorMessage("Failed to download metadata.");
            }

        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_REFRESH_FAILED, error as string, error as Error, { methodName: null }, {});
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.triggerFlow", async () => {
        oneDSLoggerWrapper.getLogger().traceInfo(
            Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
            { command: 'triggerFlow', ...getBaseEventInfo() }
        );
        try {
            // Get the PAC wrapper to access org list
            const pacWrapper = pacTerminal.getWrapper();

            let orgUrl: string | undefined;

            // Get current active org first so we can mark it in the picker
            const currentActiveOrg = await pacWrapper.activeOrg();
            const currentOrgUrl = currentActiveOrg && currentActiveOrg.Status === SUCCESS ? currentActiveOrg.Results.OrgUrl : undefined;

            // Get list of available organizations
            const orgListResult = await pacWrapper.orgList();

            if (orgListResult && orgListResult.Status === SUCCESS && orgListResult.Results.length > 0) {
                // Align item shape with Actions Hub switchEnvironment (detail holds URL, description shows CURRENT)
                const items = orgListResult.Results.map(org => {
                    return {
                        label: org.FriendlyName,
                        description: currentOrgUrl && currentOrgUrl === org.EnvironmentUrl ? vscode.l10n.t("Current") : "",
                        detail: org.EnvironmentUrl
                    };
                });

                // Add option to enter URL manually (detail intentionally blank)
                items.push({
                    label: "$(plus) Enter organization URL manually",
                    description: "",
                    detail: ""
                });

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: "Select an environment or enter URL manually",
                    ignoreFocusOut: true
                });

                if (selected) {
                    if (selected.detail) {
                        orgUrl = selected.detail; // environment URL from list
                    } else {
                        // Manual entry
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

            // Helper utilities for normalization & verification
            const normalizeUrl = (u?: string) => u ? u.replace(/\/+$/,'').toLowerCase() : u;
            const targetUrlNormalized = normalizeUrl(orgUrl);

            const verifySwitch = async (attempts = 5, delayMs = 500): Promise<boolean> => {
                for (let i = 0; i < attempts; i++) {
                    const who = await pacWrapper.activeOrg();
                    if (who && who.Status === SUCCESS && normalizeUrl(who.Results.OrgUrl) === targetUrlNormalized) {
                        return true;
                    }
                    await new Promise(r => setTimeout(r, delayMs));
                }
                return false;
            };

            const switchEnvironmentIfNeeded = async (): Promise<boolean> => {
                const active = await pacWrapper.activeOrg();
                if (!active || active.Status !== SUCCESS) {
                    // No active org context -> create auth profile (will also set context)
                    await createAuthProfileExp(pacWrapper, orgUrl!);
                    const verified = await verifySwitch();
                    if (!verified) {
                        oneDSLoggerWrapper.getLogger().traceError("MetadataDiffEnvSwitchFailed", "Post-auth verification failed", new Error("Active org mismatch"));
                        return false;
                    }
                    vscode.window.showInformationMessage("Auth profile created and environment selected.");
                    return true;
                }

                if (normalizeUrl(active.Results.OrgUrl) === targetUrlNormalized) {
                    vscode.window.showInformationMessage("Already connected to the specified environment.");
                    return true;
                }

                // Attempt switch with progress UI
                const switchResult = await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: vscode.l10n.t("Switching environment"),
                    cancellable: false
                }, async (progress) => {
                    progress.report({ message: vscode.l10n.t("Invoking pac org select...") });
                    const selectOutput = await pacWrapper.orgSelect(orgUrl!);
                    if (!selectOutput || selectOutput.Status !== SUCCESS) {
                        const errMsg = selectOutput?.Errors && selectOutput.Errors.length ? selectOutput.Errors.join("; ") : "Unknown error";
                        oneDSLoggerWrapper.getLogger().traceError("MetadataDiffEnvSwitchFailed", errMsg, new Error(errMsg));
                        return false;
                    }
                    progress.report({ message: vscode.l10n.t("Verifying environment switch...") });
                    const verified = await verifySwitch();
                    if (!verified) {
                        // One retry attempt
                        progress.report({ message: vscode.l10n.t("Retrying environment switch...") });
                        const retryOutput = await pacWrapper.orgSelect(orgUrl!);
                        if (!retryOutput || retryOutput.Status !== SUCCESS) {
                            const retryErr = retryOutput?.Errors && retryOutput.Errors.length ? retryOutput.Errors.join("; ") : "Unknown retry error";
                            oneDSLoggerWrapper.getLogger().traceError("MetadataDiffEnvSwitchRetryFailed", retryErr, new Error(retryErr));
                            return false;
                        }
                        const verifiedRetry = await verifySwitch();
                        if (!verifiedRetry) {
                            oneDSLoggerWrapper.getLogger().traceError("MetadataDiffEnvSwitchVerificationFailed", "Verification failed after retry", new Error("verification failed"));
                            return false;
                        }
                    }
                    return true;
                });

                if (switchResult) {
                    vscode.window.showInformationMessage("Environment switched successfully.");
                    return true;
                }
                vscode.window.showErrorMessage("Failed to switch the environment.");
                return false;
            };

            const switched = await switchEnvironmentIfNeeded();
            if (!switched) {
                return; // Abort flow if environment not ready
            }

            const ws = getWorkspaceAndWebsiteId();
            if (!ws) { return; }
            const success = await executeDiffWorkflow(context, pacTerminal, ws.websiteId, vscode.l10n.t("Downloading website metadata"));
            if (success) {
                vscode.window.showInformationMessage(vscode.l10n.t("You can now view the comparison"));
            } else {
                vscode.window.showErrorMessage("Failed to download metadata.");
            }

        }
        catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_REFRESH_FAILED, error as string, error as Error, { methodName: null }, {});
        }
    });

    vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.generateReport", async () => {
        oneDSLoggerWrapper.getLogger().traceInfo(
            Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
            { command: 'generateReport', ...getBaseEventInfo() }
        );
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
        oneDSLoggerWrapper.getLogger().traceInfo(
            Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
            { command: 'exportReport', ...getBaseEventInfo() }
        );
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
        oneDSLoggerWrapper.getLogger().traceInfo(
            Constants.EventNames.METADATA_DIFF_COMMAND_EXECUTED,
            { command: 'importReport', ...getBaseEventInfo() }
        );
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

                // Use existing provider if present so Actions Hub keeps reference; otherwise create & register new provider.
                // Accessing static private for backward compatibility without altering class surface area.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const existingProvider = (MetadataDiffDesktop as any)._treeDataProvider as MetadataDiffTreeDataProvider | undefined;
                const treeDataProvider = existingProvider || new MetadataDiffTreeDataProvider(context);
                if (!existingProvider) {
                    MetadataDiffDesktop.setTreeDataProvider(treeDataProvider);
                    ActionsHubTreeDataProvider.setMetadataDiffProvider(treeDataProvider);
                }
                await treeDataProvider.setDiffFiles(report.files); // triggers refresh + context updates
                vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");

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
