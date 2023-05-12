/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import WebExtensionContext from '../WebExtensionContext';
import { telemetryEventNames } from '../telemetry/constants';
import { PROVIDER_ID, SCOPE_OPTION_DEFAULT, SCOPE_OPTION_OFFLINE_ACCESS, INTELLIGENCE_SCOPE_DEFAULT } from './constants';
import { ERRORS, showErrorDialog } from './errorHandler';

export function getHeader(accessToken: string, useOctetStreamContentType?: boolean) {
    return {
        authorization: "Bearer " + accessToken,
        'content-type': useOctetStreamContentType ? 'application/octet-stream' : "application/json; charset=utf-8",
        accept: "application/json",
        'OData-MaxVersion': "4.0",
        'OData-Version': "4.0",
    };
}


//Get access token for Intelligence API service
export async function intelligenceAPIAuthentication(): Promise<string> {
    let accessToken = '';
    //WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_INTELLIGENCE_API_AUTHENTICATION_STARTED);
    try {
        let session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { silent: true });
        if (!session) {
            session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { createIfNone: true });
        }

        accessToken = session?.accessToken ?? '';
        if (!accessToken) {
            throw new Error(ERRORS.NO_ACCESS_TOKEN);
        }

        //WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_INTELLIGENCE_API_AUTHENTICATION_COMPLETED, { "userId": session?.account.id.split('/').pop() ?? session?.account.id ?? '' });
    } catch (error) {
        //const authError = (error as Error)?.message;
        showErrorDialog(vscode.l10n.t("Authorization Failed. Please run again to authorize it"),
        vscode.l10n.t("There was a permissions problem with the server"));
        //WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_INTELLIGENCE_API_AUTHENTICATION_FAILED, authError);
    }
    return accessToken;
}

export async function dataverseAuthentication(dataverseOrgURL: string): Promise<string> {
    let accessToken = '';
    WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_STARTED);
    try {

        let session = await vscode.authentication.getSession(PROVIDER_ID, [`${dataverseOrgURL}${SCOPE_OPTION_DEFAULT}`, `${SCOPE_OPTION_OFFLINE_ACCESS}`], { silent: true });
        if (!session) {
            session = await vscode.authentication.getSession(PROVIDER_ID, [`${dataverseOrgURL}${SCOPE_OPTION_DEFAULT}`, `${SCOPE_OPTION_OFFLINE_ACCESS}`], { createIfNone: true });
        }

        accessToken = session?.accessToken ?? '';
        if (!accessToken) {
            throw new Error(ERRORS.NO_ACCESS_TOKEN);
        }

        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED, { "userId": session?.account.id.split('/').pop() ?? session?.account.id ?? '' });
    } catch (error) {
        const authError = (error as Error)?.message;
        showErrorDialog(vscode.l10n.t("Authorization Failed. Please run again to authorize it"),
        vscode.l10n.t("There was a permissions problem with the server"));
        WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED, authError);
    }

    return accessToken;
}

export async function npsAuthentication(cesSurveyAuthorizationEndpoint: string): Promise<string> {
    let accessToken = '';
    WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.NPS_AUTHENTICATION_STARTED);
    try {
        const session = await vscode.authentication.getSession(PROVIDER_ID, [cesSurveyAuthorizationEndpoint], { silent: true });
        accessToken = session?.accessToken ?? '';
        if (!accessToken) {
            throw new Error(ERRORS.NO_ACCESS_TOKEN);
        }
        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.NPS_AUTHENTICATION_COMPLETED);
    } catch (error) {
        const authError = (error as Error)?.message;
        showErrorDialog(vscode.l10n.t("Authorization Failed. Please run again to authorize it"),
            vscode.l10n.t("There was a permissions problem with the server"));
        WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.NPS_AUTHENTICATION_FAILED, authError);
    }

    return accessToken;
}
