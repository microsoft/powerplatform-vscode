/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
import { sendErrorTelemetry } from '../telemetry/webExtensionTelemetry';
import { pathParamToSchema, PROVIDER_ID, telemetryEventNames } from './constants';
import PowerPlatformExtensionContextManager from "./localStore";

export function getHeader(accessToken: string) {
    return {
        authorization: "Bearer " + accessToken,
        'content-type': "application/json; charset=utf-8",
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
            {
                sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_NO_ACCESS_TOKEN);
            }
        }
    } catch (error) {
        const authError = (error as Error)?.message;
        sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED, authError);
    }
    return accessToken;
}

export function getCustomRequestURL(dataverseOrgUrl: string, entity: string, urlQuery: string): string {
    const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    const parameterizedUrl = powerPlatformContext.dataSourcePropertiesMap.get(urlQuery) as string;
    const fetchQueryParameters = powerPlatformContext.entitiesSchemaMap.get(pathParamToSchema.get(entity) as string)?.get("_fetchQueryParameters");
    const requestUrl = parameterizedUrl.replace('{dataverseOrgUrl}', dataverseOrgUrl)
        .replace('{entity}', entity)
        .replace('{api}', powerPlatformContext.dataSourcePropertiesMap.get('api') as string)
        .replace('{data}', powerPlatformContext.dataSourcePropertiesMap.get('data') as string)
        .replace('{version}', powerPlatformContext.dataSourcePropertiesMap.get('version') as string);
    return requestUrl + fetchQueryParameters;
}
