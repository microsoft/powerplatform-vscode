/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import { sendErrorTelemetry } from '../telemetry/webExtensionTelemetry';
import { pathParamToSchema, PROVIDER_ID, telemetryEventNames } from './constants';
import { dataSourcePropertiesMap } from './localStore';

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
    } catch (error) {
        vscode.window.showErrorMessage(localize("microsoft-powerapps-portals.webExtension.init.authorization.error", "Authorization Failed. Please run again to authorize it"));
        const authError = (error as Error)?.message;
        sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED, authError);
    }
    return accessToken;
}

export function getCustomRequestURL(dataverseOrgUrl: string, entity: string, urlQuery: string, entitiesSchemaMap: Map<string, Map<string, string>>): string {
    const parameterizedUrl = dataSourcePropertiesMap.get(urlQuery) as string;
    const fetchQueryParameters = entitiesSchemaMap.get(pathParamToSchema.get(entity) as string)?.get("_fetchQueryParameters");
    const requestUrl = parameterizedUrl.replace('{dataverseOrgUrl}', dataverseOrgUrl).replace('{entity}', entity).replace('{api}', dataSourcePropertiesMap.get('api') as string).replace('{data}', dataSourcePropertiesMap.get('data') as string).replace('{version}', dataSourcePropertiesMap.get('version') as string);
    if(fetchQueryParameters)
        return requestUrl + fetchQueryParameters;
    return requestUrl;
}
