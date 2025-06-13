/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { EnableActionsHub } from "../../../common/ecs-features/ecsFeatureGates";
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

    static async initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal): Promise<void> {
        if (ActionsHub._isInitialized) {
            return;
        }

        try {
            const isActionsHubEnabled = ActionsHub.isEnabled();

            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_ENABLED, {
                isEnabled: isActionsHubEnabled.toString(),
                ...getBaseEventInfo()
            });

            vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", isActionsHubEnabled);

            if (!isActionsHubEnabled) {
                return;
            }

            ActionsHubTreeDataProvider.initialize(context, pacTerminal);
            ActionsHub._isInitialized = true;
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_INITIALIZED, getBaseEventInfo());
        } catch (exception) {
            const exceptionError = exception as Error;
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_INITIALIZATION_FAILED, exceptionError.message, exceptionError, getBaseEventInfo());
        }
    }
}
