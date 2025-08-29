/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { sendTelemetryEvent } from "../copilot/telemetry/copilotTelemetry";
import { CopilotLoginFailureEvent, CopilotLoginSuccessEvent } from "../copilot/telemetry/telemetryConstants";
import { getUserAgent } from "../utilities/Utils";
import {
    VSCODE_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED,
    VSCODE_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED,
    VSCODE_EXTENSION_NPS_AUTHENTICATION_COMPLETED,
    VSCODE_EXTENSION_NPS_AUTHENTICATION_FAILED,
    VSCODE_EXTENSION_NPS_AUTHENTICATION_STARTED,
    VSCODE_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_FAILED,
    VSCODE_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_COMPLETED,
    VSCODE_EXTENSION_BAP_SERVICE_AUTHENTICATION_COMPLETED,
    VSCODE_EXTENSION_BAP_SERVICE_AUTHENTICATION_FAILED,
    VSCODE_EXTENSION_DECODE_JWT_TOKEN_FAILED,
    VSCODE_EXTENSION_PPAPI_WEBSITES_AUTHENTICATION_COMPLETED,
    VSCODE_EXTENSION_PPAPI_WEBSITES_AUTHENTICATION_FAILED
} from "./TelemetryConstants";
import { ERROR_CONSTANTS } from "../ErrorConstants";
import {
    BAP_SERVICE_SCOPE_DEFAULT,
    INTELLIGENCE_SCOPE_DEFAULT,
    PPAPI_GCC_WEBSITES_SERVICE_SCOPE_DEFAULT,
    PPAPI_HIGH_WEBSITES_SERVICE_SCOPE_DEFAULT,
    PPAPI_DOD_WEBSITES_SERVICE_SCOPE_DEFAULT,
    PPAPI_MOONCAKE_WEBSITES_SERVICE_SCOPE_DEFAULT,
    PPAPI_PREPROD_WEBSITES_SERVICE_SCOPE_DEFAULT,
    PPAPI_TEST_WEBSITES_SERVICE_SCOPE_DEFAULT,
    PPAPI_WEBSITES_SERVICE_SCOPE_DEFAULT,
    PROVIDER_ID,
    SCOPE_OPTION_CONTACTS_READ,
    SCOPE_OPTION_DEFAULT,
    SCOPE_OPTION_OFFLINE_ACCESS,
    SCOPE_OPTION_USERS_READ_BASIC_ALL,
    ServiceEndpointCategory
} from "./Constants";
import jwt_decode from 'jwt-decode';
import { showErrorDialog } from "../utilities/errorHandlerUtil";
import { oneDSLoggerWrapper } from "../OneDSLoggerTelemetry/oneDSLoggerWrapper";

export const serviceScopeMapping: { [key in ServiceEndpointCategory]: string } = {
    [ServiceEndpointCategory.NONE]: "",
    [ServiceEndpointCategory.PROD]: PPAPI_WEBSITES_SERVICE_SCOPE_DEFAULT,
    [ServiceEndpointCategory.PREPROD]: PPAPI_PREPROD_WEBSITES_SERVICE_SCOPE_DEFAULT,
    [ServiceEndpointCategory.TEST]: PPAPI_TEST_WEBSITES_SERVICE_SCOPE_DEFAULT,
    [ServiceEndpointCategory.MOONCAKE]: PPAPI_MOONCAKE_WEBSITES_SERVICE_SCOPE_DEFAULT,
    [ServiceEndpointCategory.GCC]: PPAPI_GCC_WEBSITES_SERVICE_SCOPE_DEFAULT,
    [ServiceEndpointCategory.HIGH]: PPAPI_HIGH_WEBSITES_SERVICE_SCOPE_DEFAULT,
    [ServiceEndpointCategory.DOD]: PPAPI_DOD_WEBSITES_SERVICE_SCOPE_DEFAULT
};

export function getCommonHeadersForDataverse(
    accessToken: string,
    useOctetStreamContentType?: boolean
) {
    return {
        authorization: "Bearer " + accessToken,
        "content-type": useOctetStreamContentType
            ? "application/octet-stream"
            : "application/json; charset=utf-8",
        accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "x-ms-user-agent": getUserAgent()
    };
}

export function getCommonHeaders(
    accessToken: string,
    useOctetStreamContentType?: boolean
) {
    return {
        authorization: "Bearer " + accessToken,
        "content-type": useOctetStreamContentType
            ? "application/octet-stream"
            : "application/json; charset=utf-8",
        accept: "application/json",
    };
}

//Get access token for Intelligence API service
export async function intelligenceAPIAuthentication(sessionID: string, orgId: string, firstTimeAuth = false): Promise<{ accessToken: string, user: string, userId: string }> {
    let accessToken = '';
    let user = '';
    let userId = '';
    try {
        const session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { silent: true });

        if (!session) {
            return { accessToken, user, userId };
        }

        accessToken = session?.accessToken ?? '';
        user = session?.account?.label ?? '';
        userId = getOIDFromToken(accessToken);

        if (!accessToken) {
            throw new Error(ERROR_CONSTANTS.NO_ACCESS_TOKEN);
        }

        if (firstTimeAuth) {
            sendTelemetryEvent({ eventName: CopilotLoginSuccessEvent, copilotSessionId: sessionID, orgId: orgId });
        }
    } catch (error) {
        showErrorDialog(vscode.l10n.t("Authorization Failed. Please run again to authorize it"),
            vscode.l10n.t("There was a permissions problem with the server"));
        sendTelemetryEvent({ eventName: CopilotLoginFailureEvent, copilotSessionId: sessionID, orgId: orgId, errorMsg: (error as Error).message });
    }
    return { accessToken, user, userId };
}

export async function dataverseAuthentication(
    dataverseOrgURL: string,
    firstTimeAuth = false
): Promise<{ accessToken: string, userId: string }> {
    let accessToken = "";
    let userId = "";
    try {
        const session = await vscode.authentication.getSession(
            PROVIDER_ID,
            [
                `${dataverseOrgURL}${SCOPE_OPTION_DEFAULT}`,
                `${SCOPE_OPTION_OFFLINE_ACCESS}`,
            ],
            { silent: true }
        );

        if (!session) {
            return { accessToken, userId };
        }

        accessToken = session?.accessToken ?? "";
        userId = getOIDFromToken(accessToken);
        if (!accessToken) {
            throw new Error(ERROR_CONSTANTS.NO_ACCESS_TOKEN);
        }

        if (firstTimeAuth) {
            sendTelemetryEvent({
                eventName: VSCODE_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED,
                userId: userId
            });
        }
    } catch (error) {
        showErrorDialog(
            vscode.l10n.t(
                "Authorization Failed. Please run again to authorize it"
            ),
            vscode.l10n.t("There was a permissions problem with the server")
        );
        sendTelemetryEvent(
            {
                eventName: VSCODE_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED,
                errorMsg: (error as Error).message
            }
        );
    }

    return { accessToken, userId };
}

export async function npsAuthentication(
    cesSurveyAuthorizationEndpoint: string
): Promise<string> {
    let accessToken = "";
    sendTelemetryEvent(
        { eventName: VSCODE_EXTENSION_NPS_AUTHENTICATION_STARTED }
    );
    try {
        const session = await vscode.authentication.getSession(
            PROVIDER_ID,
            [cesSurveyAuthorizationEndpoint],
            { silent: true }
        );
        accessToken = session?.accessToken ?? "";
        if (!accessToken) {
            throw new Error(ERROR_CONSTANTS.NO_ACCESS_TOKEN);
        }
        sendTelemetryEvent(
            { eventName: VSCODE_EXTENSION_NPS_AUTHENTICATION_COMPLETED }
        );
    } catch (error) {
        showErrorDialog(
            vscode.l10n.t(
                "Authorization Failed. Please run again to authorize it"
            ),
            vscode.l10n.t("There was a permissions problem with the server")
        );
        sendTelemetryEvent(
            {
                eventName: VSCODE_EXTENSION_NPS_AUTHENTICATION_FAILED,
                errorMsg: (error as Error).message
            }
        );
    }

    return accessToken;
}

export async function graphClientAuthentication(
    firstTimeAuth = false
): Promise<string> {
    let accessToken = "";
    try {
        let session = await vscode.authentication.getSession(
            PROVIDER_ID,
            [
                SCOPE_OPTION_CONTACTS_READ,
                SCOPE_OPTION_USERS_READ_BASIC_ALL,
            ],
            { silent: true }
        );

        if (!session) {
            session = await vscode.authentication.getSession(
                PROVIDER_ID,
                [
                    SCOPE_OPTION_CONTACTS_READ,
                    SCOPE_OPTION_USERS_READ_BASIC_ALL,
                ],
                { createIfNone: true }
            );
        }

        accessToken = session?.accessToken ?? "";
        if (!accessToken) {
            throw new Error(ERROR_CONSTANTS.NO_ACCESS_TOKEN);
        }

        if (firstTimeAuth) {
            sendTelemetryEvent({
                eventName: VSCODE_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_COMPLETED,
                userId: getOIDFromToken(accessToken),
            });
        }
    } catch (error) {
        showErrorDialog(
            vscode.l10n.t(
                "Authorization Failed. Please run again to authorize it"
            ),
            vscode.l10n.t("There was a permissions problem with the server")
        );
        sendTelemetryEvent(
            { eventName: VSCODE_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_FAILED, errorMsg: (error as Error).message }
        )
    }

    return accessToken;
}

export async function bapServiceAuthentication(
    firstTimeAuth = false
): Promise<string> {
    let accessToken = "";
    try {
        const session = await vscode.authentication.getSession(
            PROVIDER_ID,
            [BAP_SERVICE_SCOPE_DEFAULT],
            { silent: true }
        );

        if (!session) {
            return accessToken;
        }

        accessToken = session?.accessToken ?? "";
        if (!accessToken) {
            throw new Error(ERROR_CONSTANTS.NO_ACCESS_TOKEN);
        }

        if (firstTimeAuth) {
            sendTelemetryEvent({
                eventName: VSCODE_EXTENSION_BAP_SERVICE_AUTHENTICATION_COMPLETED,
                userId: getOIDFromToken(accessToken),
            });
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes("User did not consent to login.")) { //Error message when user did not consent to login
            return '';
        }
        showErrorDialog(
            vscode.l10n.t(
                "Authorization Failed. Please run again to authorize it"
            ),
            vscode.l10n.t("There was a permissions problem with the server")
        );
        sendTelemetryEvent(
            { eventName: VSCODE_EXTENSION_BAP_SERVICE_AUTHENTICATION_FAILED, errorMsg: (error as Error).message }
        )
    }

    return accessToken;
}

export function getOIDFromToken(token: string) {
    try {
        const decoded = jwt_decode(token);
        return decoded?.oid ?? "";
    } catch (error) {
        sendTelemetryEvent(
            { eventName: VSCODE_EXTENSION_DECODE_JWT_TOKEN_FAILED, errorMsg: (error as Error).message }
        )
    }
    return "";
}

export async function powerPlatformAPIAuthentication(
    serviceEndpointStamp: ServiceEndpointCategory,
    firstTimeAuth = false
): Promise<string> {
    let accessToken = "";
    const PPAPI_WEBSITES_ENDPOINT = serviceScopeMapping[serviceEndpointStamp];
    try {
        const session = await vscode.authentication.getSession(
            PROVIDER_ID,
            [PPAPI_WEBSITES_ENDPOINT],
            { silent: true }
        );

        if (!session) {
            return accessToken;
        }

        accessToken = session?.accessToken ?? "";
        if (!accessToken) {
            throw new Error(ERROR_CONSTANTS.NO_ACCESS_TOKEN);
        }

        if (firstTimeAuth) {
            sendTelemetryEvent({
                eventName: VSCODE_EXTENSION_PPAPI_WEBSITES_AUTHENTICATION_COMPLETED,
                userId:
                    session?.account.id.split("/").pop() ??
                    session?.account.id ??
                    "",
            });
        }
    } catch (error) {
        showErrorDialog(
            vscode.l10n.t(
                "Authorization Failed. Please run again to authorize it"
            ),
            vscode.l10n.t("There was a permissions problem with the server")
        );
        sendTelemetryEvent(
            { eventName: VSCODE_EXTENSION_PPAPI_WEBSITES_AUTHENTICATION_FAILED, errorMsg: (error as Error).message }
        )
    }

    return accessToken;
}

/**
 * Authenticate the user using Microsoft as authentication provider.
 * @param isSilent - If true, the authentication will be done silently without showing a dialog.
 * @returns A promise that resolves when the authentication is complete.
 *
 */
export async function authenticateUserInVSCode(isSilent = false): Promise<void> {
    if (isSilent) {
        await authenticateUserInternal(false);
    } else {
        const isAuthenticated = await authenticateUserInternal(true);
        if (!isAuthenticated) {
            const secondAttempt = await authenticateUserInternal(false);
            if (!secondAttempt) {
                // If both attempts failed and it's not a silent call, inform the user
                throw new Error(vscode.l10n.t("Authentication failed. Please try again or check your internet connection."));
            }
        }
    }
}

/**
 * Authenticate the user using the authentication provider.
 * @param createIfNone - If true, an authentication dialog will be shown to user.
 * @returns A promise that resolves to true if authentication is successful, false otherwise.
 */
async function authenticateUserInternal(createIfNone: boolean): Promise<boolean> {
    try {
        const session = await vscode.authentication.getSession(PROVIDER_ID, [], { createIfNone: createIfNone });

        if (session) {
            const userId = getOIDFromToken(session.accessToken);
            oneDSLoggerWrapper.getLogger().traceInfo("VSCodeDesktopUserAuthenticationSuccessful", { userId, createIfNone });
            return true;
        }
    } catch (error) {
        const errorMessage = error as Error;
        oneDSLoggerWrapper.getLogger().traceError("VSCodeDesktopUserAuthenticationFailed", errorMessage.message, errorMessage, { createIfNone });
    }
    return false;
}
