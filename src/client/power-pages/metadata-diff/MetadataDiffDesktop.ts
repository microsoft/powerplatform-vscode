/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { EnableMetadataDiff } from "../../../common/ecs-features/ecsFeatureGates";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { Constants } from "../../../common/power-pages/metadata-diff/Constants";
import { MetadataDiffTreeDataProvider } from "../../../common/power-pages/metadata-diff/MetadataDiffTreeDataProvider";
import { PacTerminal } from "../../lib/PacTerminal";
import { PagesList } from "../../pac/PacTypes";
import { registerMetadataDiffCommands } from "./MetadataDiffCommands";
import { ActionsHubTreeDataProvider } from "../actions-hub/ActionsHubTreeDataProvider";

export class MetadataDiffDesktop {
    private static _isInitialized = false;
    private static _treeDataProvider: MetadataDiffTreeDataProvider | undefined;

    static isEnabled(): boolean {
        const enableMetadataDiff = ECSFeaturesClient.getConfig(EnableMetadataDiff).enableMetadataDiff

        if (enableMetadataDiff === undefined) {
            return false;
        }

        return enableMetadataDiff;
    }

    static resetTreeView(): void {
        if (this._treeDataProvider) {
            this._treeDataProvider.clearItems();
            vscode.commands.executeCommand("setContext",
                "microsoft.powerplatform.pages.metadataDiff.hasData", false);
        }
    }

    /**
     * Allows external commands to replace the active provider
     * allowing subsequent resets to use the latest instance.
     */
    static setTreeDataProvider(provider: MetadataDiffTreeDataProvider): void {
        this._treeDataProvider = provider;
    }

    static async initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal): Promise<void> {
        if (MetadataDiffDesktop._isInitialized) {
            return;
        }

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

            await registerMetadataDiffCommands(context, pacTerminal);

            const treeDataProvider = MetadataDiffTreeDataProvider.initialize(context);
            MetadataDiffDesktop._treeDataProvider = treeDataProvider;
            ActionsHubTreeDataProvider.setMetadataDiffProvider(treeDataProvider);
            vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");
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
        if (pagesListOutput && pagesListOutput.Status === "Success" && pagesListOutput.Information) {
            const pagesList: PagesList[] = [];
            if (Array.isArray(pagesListOutput.Information)) {
                pagesListOutput.Information.forEach(line => {
                    if (!line.trim() || !line.includes('[')) {
                        return;
                    }

                    const regex = /\s*\[\d+\]\s+([a-f0-9-]+)\s+(.+?)\s+(Standard|Enhanced)(?:\s{2,}.*)?$/i;
                    const match = line.match(regex);
                    if (match) {
                        const modelVersion = match[3].trim().toLowerCase() === "enhanced" ? "2" : "1";
                        pagesList.push({
                            WebsiteId: match[1].trim(),
                            FriendlyName: match[2].trim(),
                            ModelVersion: modelVersion
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
