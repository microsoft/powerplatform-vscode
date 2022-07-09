/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { PROVIDER_ID, SCOPE_OPTION, SCOPE_VERB } from './constants';
import { ERRORS } from './errorHandler';

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
