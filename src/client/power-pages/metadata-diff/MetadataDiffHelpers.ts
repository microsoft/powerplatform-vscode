/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import { PacTerminal } from "../../lib/PacTerminal";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { Constants, SUCCESS } from "../../../common/power-pages/metadata-diff/Constants";
import { MetadataDiffTreeDataProvider } from "../../../common/power-pages/metadata-diff/MetadataDiffTreeDataProvider";
import { MetadataDiffDesktop } from "./MetadataDiffDesktop";
import { ActionsHubTreeDataProvider } from "../actions-hub/ActionsHubTreeDataProvider";
import { getMetadataDiffBaseEventInfo } from "./MetadataDiffTelemetry";

// Small data container for timings
export interface ComparisonTimings {
    totalMs: number;
    downloadMs: number;
    diffBuildMs: number;
}

export interface ComparisonResult {
    success: boolean;
    timings: ComparisonTimings;
}

/**
 * Ensures a single folder workspace & returns paths + website id.
 */
export function resolveWorkspaceAndWebsiteId(getWebsiteId: (workspaceFolderPath: string) => string | undefined): { workspacePath: string, storagePath: string, websiteId: string } | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage(vscode.l10n.t("No folders opened in the current workspace."));
        return undefined;
    }
    const workspacePath = folders[0].uri.fsPath;
    const storagePath = vscode.workspace.getWorkspaceFolder(folders[0].uri)?.uri.fsPath; // fallback, usually extension context handles storage
    // Storage path for Metadata Diff is provided by extension context.storageUri; caller validates existence.
    const websiteId = getWebsiteId(workspacePath) || "";
    if (!websiteId) {
        vscode.window.showErrorMessage(vscode.l10n.t("Unable to determine website id from workspace."));
        return undefined;
    }
    return { workspacePath, storagePath: storagePath || workspacePath, websiteId };
}

/**
 * Removes & recreates the given storage directory.
 */
export function resetDirectory(dir: string): void {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
}

/**
 * Returns model version accepted by pac pages download ("1" | "2").
 */
export function toModelVersion(modelVersion: string): string {
    return (modelVersion === "v1" || modelVersion === "Standard") ? "1" : "2";
}

/**
 * Shared routine used by triggerFlow / resync / triggerFlowWithSite.
 * Handles: listing sites, locating site, calling pages download, building diff provider.
 */
export async function buildComparison(
    context: vscode.ExtensionContext,
    pacTerminal: PacTerminal,
    websiteId: string,
    progressTitle: string,
    scenario: string
): Promise<ComparisonResult> {
    const pacWrapper = pacTerminal.getWrapper();
    const start = Date.now();
    let downloadStart = 0; let downloadEnd = 0; let buildStart = 0; let buildEnd = 0;
    let success = false;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: progressTitle,
        cancellable: false
    }, async (progress) => {
        progress.report({ message: vscode.l10n.t("Locating website in environment...") });
        const pages = await MetadataDiffDesktop.getPagesList(pacTerminal);
        const record = pages.find(p => p.id === websiteId);
        if (!record) {
            vscode.window.showErrorMessage(vscode.l10n.t("Website not found in the connected environment."));
            return;
        }
        progress.report({ message: vscode.l10n.t('Retrieving "{0}" as {1} data model. Please wait...', record.name, record.modelVersion === 'v2' ? 'enhanced' : 'standard') });
        const storagePath = context.storageUri?.fsPath;
        if (!storagePath) {
            vscode.window.showErrorMessage(vscode.l10n.t("Storage path not found"));
            return;
        }
        resetDirectory(storagePath);
        downloadStart = Date.now();
        const download = await pacWrapper.pagesDownload(storagePath, websiteId, toModelVersion(record.modelVersion));
        downloadEnd = Date.now();
        if (download && download.Status === SUCCESS) {
            progress.report({ message: vscode.l10n.t('Comparing metadata of "{0}"...', record.name) });
            buildStart = Date.now();
            const provider = MetadataDiffTreeDataProvider.initialize(context);
            MetadataDiffDesktop.setTreeDataProvider(provider);
            ActionsHubTreeDataProvider.setMetadataDiffProvider(provider);
            await provider.getChildren();
            vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");
            buildEnd = Date.now();
            success = true;
        }
    });

    const timings: ComparisonTimings = {
        totalMs: Date.now() - start,
        downloadMs: downloadEnd - downloadStart,
        diffBuildMs: buildEnd - buildStart
    };

    oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_PERF_SUMMARY, { ...getMetadataDiffBaseEventInfo(), scenario, ...timings });
    return { success, timings };
}

/** Ensures an active org before executing comparison logic. */
export async function ensureActiveOrg(pacTerminal: PacTerminal): Promise<boolean> {
    const pacWrapper = pacTerminal.getWrapper();
    const active = await pacWrapper.activeOrg();
    if (!active || active.Status !== SUCCESS) {
        vscode.window.showErrorMessage(vscode.l10n.t("No active environment found. Please authenticate first."));
        return false;
    }
    return true;
}
