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
            // Force reset tree view context to show welcome message
            vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiff.hasData", false);
        }
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
        if (pagesListOutput && pagesListOutput.Status === "Success" && pagesListOutput.Information) {
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
                    // Example line: ' [2]        8aa65ec4-1578-f011-b4cc-0022480b93b5               Customer Self Service_V1 - customerselfservice-oh1uo         Standard  '
                    const match = line.match(/\[\d+\]\s+([a-f0-9-]+)\s+(.+?)\s+Standard\s*$/i);
                    if (match) {
                        // Extract WebsiteId, FriendlyName, and ModelVersion from the line
                        // Example line: ' [2]        8aa65ec4-1578-f011-b4cc-0022480b93b5               Customer Self Service_V1 - customerselfservice-oh1uo         Standard  '
                        const modelVersionMatch = line.match(/\s(Standard|Enhanced)\s*$/i);
                        const modelVersion = modelVersionMatch ? modelVersionMatch[1].trim() : "Standard";
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
