/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { pacAuthManager } from "../../pac/PacAuthManager";
import { Constants } from './Constants';
import { oneDSLoggerWrapper } from '../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { PacTerminal } from '../../lib/PacTerminal';
import { SUCCESS } from '../../../common/constants';
import { OrgListOutput } from '../../pac/PacTypes';
import { extractAuthInfo } from '../commonUtility';

export const refreshEnvironment = async (pacTerminal: PacTerminal) => {
    const pacWrapper = pacTerminal.getWrapper();
    try {
        const pacActiveAuth = await pacWrapper.activeAuth();
        if (pacActiveAuth && pacActiveAuth.Status === SUCCESS) {
            const authInfo = extractAuthInfo(pacActiveAuth.Results);
            pacAuthManager.setAuthInfo(authInfo);
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_REFRESH_FAILED, error as string, error as Error, { methodName: refreshEnvironment.name }, {});
    }
}

const getEnvironmentDetails = () => {
    const detailsArray = [];
    detailsArray.push(vscode.l10n.t({ message: "Timestamp: {0}", args: [new Date().toISOString()], comment: "{0} is the timestamp" }));

    const authInfo = pacAuthManager.getAuthInfo();

    if (authInfo) {
        detailsArray.push(vscode.l10n.t({ message: "Tenant ID: {0}", args: [authInfo.tenantId], comment: "{0} is the Tenant ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Object ID: {0}", args: [authInfo.entraIdObjectId], comment: "{0} is the Object ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Organization ID: {0}", args: [authInfo.organizationId], comment: "{0} is the Organization ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Unique name: {0}", args: [authInfo.organizationUniqueName], comment: "{0} is the Unique name" }));
        detailsArray.push(vscode.l10n.t({ message: "Environment ID: {0}", args: [authInfo.environmentId], comment: "{0} is the Environment ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Cluster environment: {0}", args: [authInfo.environmentType], comment: "{0} is the Cluster environment" }));
        detailsArray.push(vscode.l10n.t({ message: "Cluster category: {0}", args: [authInfo.cloud], comment: "{0} is the Cluster category" }));
        detailsArray.push(vscode.l10n.t({ message: "Cluster geo name: {0}", args: [authInfo.environmentGeo], comment: "{0} is the cluster geo name" }));
    }

    return detailsArray.join('\n');
};

export const showEnvironmentDetails = async () => {
    try {
        const message = Constants.Strings.SESSION_DETAILS;
        const details = getEnvironmentDetails();

        const result = await vscode.window.showInformationMessage(`${message}\n${details}`, Constants.Strings.COPY_TO_CLIPBOARD);

        if (result == Constants.Strings.COPY_TO_CLIPBOARD) {
            await vscode.env.clipboard.writeText(details);
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_FAILED, error as string, error as Error, { methodName: showEnvironmentDetails.name }, {});
    }
};

export const switchEnvironment = async (pacTerminal: PacTerminal) => {
    const pacWrapper = pacTerminal.getWrapper();
    const authInfo = pacAuthManager.getAuthInfo();

    if (authInfo) {
        const envListOutput = await pacWrapper.orgList();
        if (envListOutput && envListOutput.Status === SUCCESS && envListOutput.Results) {
            //envListOutput.Results is an array of OrgListOutput
            const envList = envListOutput.Results as OrgListOutput[];
            //show a quick pick to select the environment with friendly name and environment url
            const selectedEnv = await vscode.window.showQuickPick(envList.map((env) => {
                return {
                    label: env.FriendlyName,
                    description: env.EnvironmentUrl
                }
            }),
                {
                    placeHolder: vscode.l10n.t(Constants.Strings.SELECT_ENVIRONMENT)
                }
            );

            if (selectedEnv) {
                await pacWrapper.orgSelect(selectedEnv.description);
            }
        }
    }
}
