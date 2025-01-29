/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { EnableActionsHub } from "../../../common/ecs-features/ecsFeatureGates";
import { ActionsHubTreeDataProvider } from "./ActionsHubTreeDataProvider";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

export class ActionsHub {
    static isEnabled(): boolean {
        const enableActionsHub = ECSFeaturesClient.getConfig(EnableActionsHub).enableActionsHub

        if (enableActionsHub === undefined) {
            return false;
        }

        return enableActionsHub;
    }

    static initialize(context: vscode.ExtensionContext): void {
        const isActionsHubEnabled = ActionsHub.isEnabled();

        oneDSLoggerWrapper.getLogger().traceInfo("EnableActionsHub", {
            isEnabled: isActionsHubEnabled.toString()
        });

        vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", isActionsHubEnabled);

        if (!isActionsHubEnabled) {
            return;
        }

        ActionsHubTreeDataProvider.initialize(context)
    }
}
