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
import { getBaseEventInfo } from "../actions-hub/TelemetryHelper";
import { MetadataDiffTreeDataProvider } from "../../../common/power-pages/metadata-diff/MetadataDiffTreeDataProvider";
import { PacTerminal } from "../../lib/PacTerminal";
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

            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_ENABLED, {
                isEnabled: isMetadataDiffEnabled.toString(),
                ...getBaseEventInfo()
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
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_INITIALIZED, getBaseEventInfo());

        } catch (exception) {
            const exceptionError = exception as Error;
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_INITIALIZATION_FAILED, exceptionError.message, exceptionError, getBaseEventInfo());
        }
    }

    // getPagesList removed: model version & site metadata now sourced from Actions Hub website cache (fetchWebsites)
}
