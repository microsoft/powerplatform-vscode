/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { EnableActionsHub, EnableCodeQlScan, EnableMetadataDiff } from "../../../common/ecs-features/ecsFeatureGates";
import { ActionsHubTreeDataProvider } from "./ActionsHubTreeDataProvider";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { PacTerminal } from "../../lib/PacTerminal";
import { Constants } from "./Constants";
import { getBaseEventInfo } from "./TelemetryHelper";

export class ActionsHub {
    private static _isInitialized = false;

    static isEnabled(): boolean {
        const enableActionsHub = ECSFeaturesClient.getConfig(EnableActionsHub).enableActionsHub

        if (enableActionsHub === undefined) {
            return true;
        }

        return enableActionsHub;
    }

    static isCodeQlScanEnabled(): boolean {
        const enableCodeQlScan = ECSFeaturesClient.getConfig(EnableCodeQlScan).enableCodeQlScan;

        if (enableCodeQlScan === undefined) {
            return false;
        }

        return enableCodeQlScan;
    }

    static isMetadataDiffEnabled(): boolean {
        const enableMetadataDiff = ECSFeaturesClient.getConfig(EnableMetadataDiff).enableMetadataDiff;

        return !!enableMetadataDiff;
    }

    static async initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal): Promise<void> {
        if (ActionsHub._isInitialized) {
            return;
        }

        vscode.commands.executeCommand('setContext', 'microsoft.powerplatform.pages.actionsHub.loadingWebsites', false);

        try {
            const isActionsHubEnabled = ActionsHub.isEnabled();
            const isCodeQlScanEnabled = ActionsHub.isCodeQlScanEnabled();

            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_ENABLED, {
                isEnabled: isActionsHubEnabled.toString(),
                ...getBaseEventInfo()
            });

            vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", isActionsHubEnabled);
            vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.codeQlScanEnabled", isCodeQlScanEnabled);
            vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiffEnabled", ActionsHub.isMetadataDiffEnabled());

            if (!isActionsHubEnabled) {
                return;
            }

            ActionsHubTreeDataProvider.initialize(context, pacTerminal, isCodeQlScanEnabled);
            ActionsHub._isInitialized = true;
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_INITIALIZED, getBaseEventInfo());
        } catch (exception) {
            const exceptionError = exception as Error;
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_INITIALIZATION_FAILED, exceptionError.message, exceptionError, getBaseEventInfo());
        }
    }
}
