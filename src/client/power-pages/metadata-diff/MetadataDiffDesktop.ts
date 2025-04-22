/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { EnableMetadataDiff } from "../../../common/ecs-features/ecsFeatureGates";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { Constants, SUCCESS } from "../../../common/power-pages/metadata-diff/Constants";
import { MetadataDiffTreeDataProvider } from "../../../common/power-pages/metadata-diff/MetadataDiffTreeDataProvider";
import { PacTerminal } from "../../lib/PacTerminal";
import { createAuthProfileExp } from "../../../common/utilities/PacAuthUtil";
import path from "path";
import { getWebsiteRecordId } from "../../../common/utilities/WorkspaceInfoFinderUtil";
import { PagesList } from "../../pac/PacTypes";

export class MetadataDiffDesktop {
    private static _isInitialized = false;

    static isEnabled(): boolean {
        const enableMetadataDiff = ECSFeaturesClient.getConfig(EnableMetadataDiff).enableMetadataDiff

        if (enableMetadataDiff === undefined) {
            return false;
        }

        return enableMetadataDiff;
    }

    static async initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal): Promise<void> {
        if (MetadataDiffDesktop._isInitialized) {
            return;
        }

        vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.triggerFlow", async () => {
            try {
                const orgUrl = await vscode.window.showInputBox({
                    prompt: "Enter the organization URL",
                    placeHolder: "https://your-org.crm.dynamics.com"
                });

                if (!orgUrl) {
                    vscode.window.showErrorMessage("Organization URL is required to trigger the metadata diff flow.");
                    return;
                }

                const urlPattern = /^https:\/\/[a-zA-Z0-9.-]+\d*\.crm\.dynamics\.com\/?$/;
                if (!urlPattern.test(orgUrl)) {
                    vscode.window.showErrorMessage("Invalid organization URL. Please enter a valid URL in the format: https://your-org.crm.dynamics.com", { modal: true });
                    return;
                }

                const pacWrapper = pacTerminal.getWrapper()
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
                    const pacPagesList = await this.getPagesList(pacTerminal);
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
        })

        try {
            const isMetadataDiffEnabled = MetadataDiffDesktop.isEnabled();

            oneDSLoggerWrapper.getLogger().traceInfo("EnableMetadataDiff", {
                isEnabled: isMetadataDiffEnabled.toString()
            });

            vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiffEnabled", isMetadataDiffEnabled);

            if (!isMetadataDiffEnabled) {
                return;
            }

            const storagePath = context.storageUri?.fsPath;
            if (!storagePath) {
                throw new Error("Storage path is not defined");
            }
            if (fs.existsSync(storagePath)) {
                fs.rmSync(storagePath, { recursive: true, force: true });
            }
            fs.mkdirSync(storagePath, { recursive: true });

            const treeDataProvider = MetadataDiffTreeDataProvider.initialize(context);
            context.subscriptions.push(
                vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.metadataDiff", treeDataProvider)
            );

            MetadataDiffDesktop._isInitialized = true;
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_INITIALIZED);
        } catch (exception) {
            const exceptionError = exception as Error;
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_INITIALIZATION_FAILED, exceptionError.message, exceptionError);
        }
    }

    static async getPagesList(pacTerminal: PacTerminal): Promise<{ name: string, id: string, modelVersion: string }[]> {
        const pacWrapper = pacTerminal.getWrapper();
        const pagesListOutput = await pacWrapper.pagesList();
        if (pagesListOutput && pagesListOutput.Status === SUCCESS && pagesListOutput.Information) {
            // Parse the list of pages from the string output
            const pagesList: PagesList[] = [];
            if (Array.isArray(pagesListOutput.Information)) {
                // If Information is already an array of strings
                pagesListOutput.Information.forEach(line => {
                    // Skip empty lines or header lines
                    if (!line.trim() || !line.includes('[')) {
                        return;
                    }

                    // Extract the relevant parts using regex
                    const match = line.match(/\[\d+\]\s+([a-f0-9-]+)\s+(.*?)\s+(v[12])\s*$/i);
                    if (match) {
                        pagesList.push({
                            WebsiteId: match[1].trim(),
                            FriendlyName: match[2].trim(),
                            ModelVersion: match[3].trim()
                        });
                    }
                });
            }
            return pagesList.map((site) => {
                return {
                    name: site.FriendlyName,
                    id: site.WebsiteId,
                    modelVersion: site.ModelVersion
                }
            });
        }

        return [];
    }
}
