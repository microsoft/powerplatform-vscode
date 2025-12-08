/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { serviceScopeMapping } from "../../../../common/services/AuthenticationProvider";
import { PROVIDER_ID, ServiceEndpointCategory } from "../../../../common/services/Constants";
import { Constants } from "../Constants";
import { traceError, traceInfo } from "../TelemetryHelper";

export const loginToMatch = async (serviceEndpointStamp: ServiceEndpointCategory): Promise<void> => {
    // Also track that user clicked the login prompt
    traceInfo(Constants.EventNames.ACTIONS_HUB_LOGIN_PROMPT_CLICKED, {
        methodName: loginToMatch.name,
        serviceEndpointStamp: serviceEndpointStamp || 'undefined'
    });

    try {
        // Force VS Code authentication flow by clearing existing session and creating a new one
        // This will ensure the authentication dialog is shown even if user is already authenticated
        const PPAPI_WEBSITES_ENDPOINT = serviceScopeMapping[serviceEndpointStamp];

        traceInfo(Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_CALLED, {
            methodName: loginToMatch.name,
            endpoint: PPAPI_WEBSITES_ENDPOINT || 'undefined',
            hasEndpoint: !!PPAPI_WEBSITES_ENDPOINT,
            serviceEndpointStamp: serviceEndpointStamp || 'undefined'
        });

        const session = await vscode.authentication.getSession(PROVIDER_ID, [PPAPI_WEBSITES_ENDPOINT], {
            clearSessionPreference: true,
            forceNewSession: true
        });

        if (session) {
            traceInfo(Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_SUCCEEDED, {
                methodName: loginToMatch.name,
                hasAccessToken: !!session.accessToken,
                accountId: session.account?.id || 'undefined',
                sessionScopes: session.scopes?.length || 0,
                serviceEndpointStamp: serviceEndpointStamp || 'undefined'
            });
        } else {
            traceInfo(Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_CANCELLED, {
                methodName: loginToMatch.name,
                reason: 'no_session_returned',
                serviceEndpointStamp: serviceEndpointStamp || 'undefined'
            });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorType = error instanceof Error ? error.constructor.name : typeof error;

        traceError(
            Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_FAILED,
            error as Error,
            {
                methodName: loginToMatch.name,
                errorType: errorType,
                errorMessage: errorMessage,
                serviceEndpointStamp: serviceEndpointStamp || 'undefined',
                hasStamp: !!serviceEndpointStamp
            }
        );

        await vscode.window.showErrorMessage(
            Constants.Strings.AUTHENTICATION_FAILED
        );
    }
};
