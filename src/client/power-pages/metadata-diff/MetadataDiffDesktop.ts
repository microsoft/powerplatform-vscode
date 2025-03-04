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

export class MetadataDiffDesktop {
    //private readonly _disposables: vscode.Disposable[] = [];
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
                    return [];
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
                    progress.report({ message: "This may take a few minutes..." });
                    pacPagesDownload = await pacWrapper.pagesDownload(storagePath, websiteId);
                    vscode.window.showInformationMessage("Download completed.");
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
}
