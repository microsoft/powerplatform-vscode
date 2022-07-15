/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { pathParamToSchema, PROVIDER_ID, SCOPE_OPTION, SCOPE_VERB } from './constants';
import { ERRORS } from './errorHandler';
import { dataSourcePropertiesMap } from './localStore';

/* eslint-disable @typescript-eslint/no-explicit-any */
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
        const session = await vscode.authentication.getSession(PROVIDER_ID, [SCOPE_VERB + dataverseOrgURL + SCOPE_OPTION], { createIfNone: true });
        accessToken = session.accessToken;
    } catch (e: any) {
        vscode.window.showErrorMessage(ERRORS.AUTHORIZATION_FAILED);
    }
    return accessToken;
}

export function getRequestURLSingleEntity(dataverseOrgUrl: string, entity: string, entityId: string, urlquery: string, entitiesSchemaMap: any, method: string): string {
    const parameterizedUrl = dataSourcePropertiesMap.get(urlquery) as string;
    let requestUrl = parameterizedUrl.replace('{dataverseOrgUrl}', dataverseOrgUrl).replace('{entity}', entity).replace('{entityId}', entityId).replace('{api}', dataSourcePropertiesMap.get('api')).replace('{data}', dataSourcePropertiesMap.get('data')).replace('{version}', dataSourcePropertiesMap.get('version'));
    switch (method) {
        case 'GET':
            requestUrl = requestUrl + entitiesSchemaMap.get(pathParamToSchema.get(entity)).get('_query');
            break;
        default:
            break;
    }
    return requestUrl;
}
