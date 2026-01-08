/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { Constants } from '../Constants';
import { traceError, traceInfo } from '../TelemetryHelper';
import PacContext from '../../../pac/PacContext';
import ArtemisContext from '../../../ArtemisContext';

const getEnvironmentDetails = () => {
    const detailsArray = [];
    detailsArray.push(vscode.l10n.t({ message: "Timestamp: {0}", args: [new Date().toISOString()], comment: "{0} is the timestamp" }));

    const authInfo = PacContext.AuthInfo;
    const orgInfo = PacContext.OrgInfo;
    const artemisResponse = ArtemisContext.ServiceResponse.response;

    if (authInfo) {
        detailsArray.push(vscode.l10n.t({ message: "Session ID: {0}", args: [vscode.env.sessionId], comment: "{0} is the Session ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Tenant ID: {0}", args: [authInfo.TenantId], comment: "{0} is the Tenant ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Object ID: {0}", args: [authInfo.EntraIdObjectId], comment: "{0} is the Object ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Organization ID: {0}", args: [authInfo.OrganizationId], comment: "{0} is the Organization ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Unique name: {0}", args: [authInfo.OrganizationUniqueName], comment: "{0} is the Unique name" }));
        detailsArray.push(vscode.l10n.t({ message: "Instance url: {0}", args: [orgInfo?.OrgUrl], comment: "{0} is the Instance Url" }));
        detailsArray.push(vscode.l10n.t({ message: "Environment ID: {0}", args: [authInfo.EnvironmentId], comment: "{0} is the Environment ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Cluster environment: {0}", args: [artemisResponse.environment], comment: "{0} is the Cluster environment" }));
        detailsArray.push(vscode.l10n.t({ message: "Cluster category: {0}", args: [artemisResponse.clusterCategory], comment: "{0} is the Cluster category" }));
        detailsArray.push(vscode.l10n.t({ message: "Cluster geo name: {0}", args: [artemisResponse.geoName], comment: "{0} is the cluster geo name" }));
    }

    return detailsArray.join('\n');
};

export const showEnvironmentDetails = async () => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_CALLED, { methodName: showEnvironmentDetails.name });
    try {
        const message = Constants.Strings.SESSION_DETAILS;
        const details = getEnvironmentDetails();

        const result = await vscode.window.showInformationMessage(message, { detail: details, modal: true }, Constants.Strings.COPY_TO_CLIPBOARD);

        if (result === Constants.Strings.COPY_TO_CLIPBOARD) {
            await vscode.env.clipboard.writeText(details);
        }
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_FAILED, error as Error, { methodName: showEnvironmentDetails.name });
    }
};
