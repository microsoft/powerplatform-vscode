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
import { SUCCESS } from "../../../common/constants";
import { extractAuthInfo } from "../commonUtility";
import { pacAuthManager } from "../../pac/PacAuthManager";
import { Constants } from "./Constants";
import { IArtemisServiceResponse } from "../../../common/services/Interfaces";
import { ActiveOrgOutput } from "../../pac/PacTypes";

export class ActionsHub {
    static isEnabled(): boolean {
        const enableActionsHub = ECSFeaturesClient.getConfig(EnableActionsHub).enableActionsHub

        if (enableActionsHub === undefined) {
            return false;
        }

        return enableActionsHub;
    }

    static async initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal, artemisResponse: IArtemisServiceResponse | null, orgDetails: ActiveOrgOutput): Promise<void> {
        const isActionsHubEnabled = ActionsHub.isEnabled();

        oneDSLoggerWrapper.getLogger().traceInfo("EnableActionsHub", {
            isEnabled: isActionsHubEnabled.toString()
        });

        vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.actionsHubEnabled", isActionsHubEnabled);

        if (!isActionsHubEnabled) {
            return;
        }

        try {
            const pacActiveAuth = await pacTerminal.getWrapper()?.activeAuth();
            if (pacActiveAuth && pacActiveAuth.Status === SUCCESS) {
                const authInfo = extractAuthInfo(pacActiveAuth.Results);
                pacAuthManager.setAuthInfo(authInfo);
            }

            ActionsHubTreeDataProvider.initialize(context, artemisResponse, orgDetails);
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_INITIALIZATION_FAILED, error as string, error as Error, { methodName: ActionsHub.initialize.name }, {});
        }
    }
}
