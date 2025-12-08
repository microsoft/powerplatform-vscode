/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { SUCCESS } from '../../../../common/constants';
import { PacTerminal } from '../../../lib/PacTerminal';
import PacContext from '../../../pac/PacContext';
import { AuthInfo, OrgListOutput } from '../../../pac/PacTypes';
import { Constants } from '../Constants';
import { traceError, traceInfo } from '../TelemetryHelper';
import { showProgressWithNotification } from '../../../../common/utilities/Utils';


const getEnvironmentList = async (pacTerminal: PacTerminal, authInfo: AuthInfo): Promise<{ label: string, description: string, detail: string }[]> => {
    const pacWrapper = pacTerminal.getWrapper();
    const envListOutput = await pacWrapper.orgList();
    if (envListOutput && envListOutput.Status === SUCCESS && envListOutput.Results) {
        const envList = envListOutput.Results as OrgListOutput[];
        return envList.map((env) => {
            return {
                label: env.FriendlyName,
                detail: env.EnvironmentUrl,
                description: authInfo.OrganizationFriendlyName === env.FriendlyName ? Constants.Strings.CURRENT : ""
            }
        });
    }

    return [];
}

export const switchEnvironment = async (pacTerminal: PacTerminal) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_SWITCH_ENVIRONMENT_CALLED, { methodName: switchEnvironment.name });
    const pacWrapper = pacTerminal.getWrapper();
    const authInfo = PacContext.AuthInfo;

    try {
        if (authInfo) {
            const selectedEnv = await vscode.window.showQuickPick(getEnvironmentList(pacTerminal, authInfo),
                {
                    placeHolder: vscode.l10n.t(Constants.Strings.SELECT_ENVIRONMENT)
                }
            );

            if (selectedEnv && selectedEnv.label !== authInfo.OrganizationFriendlyName) {
                await showProgressWithNotification(Constants.Strings.CHANGING_ENVIRONMENT, async () => await pacWrapper.orgSelect(selectedEnv.detail));
                await vscode.window.showInformationMessage(Constants.Strings.ENVIRONMENT_CHANGED_SUCCESSFULLY);
            } else {
                traceInfo(Constants.EventNames.ACTIONS_HUB_SWITCH_ENVIRONMENT_CANCELLED, { methodName: switchEnvironment.name });
            }
        }
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_SWITCH_ENVIRONMENT_FAILED, error as Error, { methodName: switchEnvironment.name });
    }
}
