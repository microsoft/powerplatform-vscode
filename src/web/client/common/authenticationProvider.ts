/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { pathParamToSchema, PROVIDER_ID } from './constants';
import { ERRORS } from './errorHandler';
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
        vscode.window.showErrorMessage(ERRORS.AUTHORIZATION_FAILED);
    }
    return accessToken;
}

export function getRequestURLForSingleEntity(dataverseOrgUrl: string, entity: string, entityId: string, urlquery: string, entitiesSchemaMap: Map<string, Map<string, string>>, method: string): string {
    const parameterizedUrl = dataSourcePropertiesMap.get(urlquery) as string;
    let requestUrl = parameterizedUrl.replace('{dataverseOrgUrl}', dataverseOrgUrl).replace('{entity}', entity).replace('{entityId}', entityId).replace('{api}', dataSourcePropertiesMap.get('api') as string).replace('{data}', dataSourcePropertiesMap.get('data') as string).replace('{version}', dataSourcePropertiesMap.get('version') as string);
    switch (method) {
        case 'GET':
            requestUrl = requestUrl + entitiesSchemaMap.get(pathParamToSchema.get(entity) as string)?.get('_fetchQueryParameters');
            break;
        default:
            break;
    }
    return requestUrl;
}

export function getCustomRequestURL(dataverseOrgUrl: string, entity: string, urlQuery: string, entitiesSchemaMap: Map<string, Map<string, string>>): string {
    const parameterizedUrl = dataSourcePropertiesMap.get(urlQuery) as string;
    const fetchQueryParameters = entitiesSchemaMap.get(pathParamToSchema.get(entity) as string)?.get("_fetchQueryParameters");
    const requestUrl = parameterizedUrl.replace('{dataverseOrgUrl}', dataverseOrgUrl).replace('{entity}', entity).replace('{api}', dataSourcePropertiesMap.get('api') as string).replace('{data}', dataSourcePropertiesMap.get('data') as string).replace('{version}', dataSourcePropertiesMap.get('version') as string);
    return requestUrl + fetchQueryParameters;
}
