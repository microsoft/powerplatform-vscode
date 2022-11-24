/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
import { sendErrorTelemetry, sendInfoTelemetry } from '../telemetry/webExtensionTelemetry';
import { PROVIDER_ID, telemetryEventNames } from './constants';

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
        const session = await vscode.authentication.getSession(PROVIDER_ID, [`${dataverseOrgURL}//.default`, 'offline_access'], { createIfNone: true });
        accessToken = session.accessToken;

        if (!accessToken) {
            sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_NO_ACCESS_TOKEN);
        }
        sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED, { "userId": session.account.id.split('/').pop() ?? session.account.id });
    } catch (error) {
        const authError = (error as Error)?.message;
        sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED, authError);
    }
    return accessToken;
}
