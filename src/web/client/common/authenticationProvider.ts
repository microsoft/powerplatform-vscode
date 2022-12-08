/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import powerPlatformExtensionContext from '../powerPlatformExtensionContext';
import { telemetryEventNames } from '../telemetry/constants';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
import { PROVIDER_ID, SCOPE_OPTION_DEFAULT, SCOPE_OPTION_OFFLINE_ACCESS } from './constants';
import { showErrorDialog } from './errorHandler';

export function getHeader(accessToken: string, useOctetStreamContentType?: boolean) {
    return {
        authorization: "Bearer " + accessToken,
        'content-type': useOctetStreamContentType ? 'application/octet-stream' : "application/json; charset=utf-8",
        accept: "application/json",
        'OData-MaxVersion': "4.0",
        'OData-Version': "4.0",
    };
}

export async function dataverseAuthentication(dataverseOrgURL: string): Promise<string> {
    let accessToken = '';
    try {

        let session = await vscode.authentication.getSession(PROVIDER_ID, [`${dataverseOrgURL}${SCOPE_OPTION_DEFAULT}`, `${SCOPE_OPTION_OFFLINE_ACCESS}`], { silent: true });
        if (!session) {
            session = await vscode.authentication.getSession(PROVIDER_ID, [`${dataverseOrgURL}${SCOPE_OPTION_DEFAULT}`, `${SCOPE_OPTION_OFFLINE_ACCESS}`], { createIfNone: true });
        }

        accessToken = session?.accessToken ?? '';
        powerPlatformExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED, { "userId": session?.account.id.split('/').pop() ?? session?.account.id ?? '' });
    } catch (error) {
        const authError = (error as Error)?.message;
        powerPlatformExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED, authError);
    }

    if (!accessToken) {
        showErrorDialog(nls.localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"),
            nls.localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
        powerPlatformExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_NO_ACCESS_TOKEN);
    }

    return accessToken;
}
