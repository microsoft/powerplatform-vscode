/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ECSFeaturesClient } from "../../ecs-features/ecsFeatureClient";
import { EnableMetadataDiff } from "../../ecs-features/ecsFeatureGates";
import { MetadataDiffTreeDataProvider } from "./MetadataDiffTreeDataProvider";
import { oneDSLoggerWrapper } from "../../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { Constants } from "./Constants";

export class MetadataDiff {
    private static _isInitialized = false;

    static isEnabled(): boolean {
        const enableMetadataDiff = ECSFeaturesClient.getConfig(EnableMetadataDiff).enableMetadataDiff

        if (enableMetadataDiff === undefined) {
            return false;
        }

        return enableMetadataDiff;
    }

    static async initialize(context: vscode.ExtensionContext): Promise<void> {
        if (MetadataDiff._isInitialized) {
            return;
        }

        try {
            const isMetadataDiffEnabled = MetadataDiff.isEnabled();

            oneDSLoggerWrapper.getLogger().traceInfo("EnableMetadataDiff", {
                isEnabled: isMetadataDiffEnabled.toString()
            });

            vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiffEnabled", isMetadataDiffEnabled);

            if (!isMetadataDiffEnabled) {
                return;
            }
            const treeDataProvider = MetadataDiffTreeDataProvider.initialize(context);
            context.subscriptions.push(
                vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.metadataDiff", treeDataProvider)
            );

            MetadataDiff._isInitialized = true;
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_INITIALIZED);
        } catch (exception) {
            const exceptionError = exception as Error;
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_INITIALIZATION_FAILED, exceptionError.message, exceptionError);
        }
    }
}
