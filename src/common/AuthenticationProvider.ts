/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { showErrorDialog } from "../web/client/common/errorHandler";
import { ITelemetry } from "../client/telemetry/ITelemetry";
import { sendTelemetryEvent } from "./copilot/telemetry/copilotTelemetry";
import { CopilotLoginFailureEvent, CopilotLoginSuccessEvent } from "./copilot/telemetry/telemetryConstants";
import { getUserAgent } from "./Utils";
import {
    VSCODE_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED,
    VSCODE_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED,
    VSCODE_EXTENSION_NPS_AUTHENTICATION_COMPLETED,
    VSCODE_EXTENSION_NPS_AUTHENTICATION_FAILED,
    VSCODE_EXTENSION_NPS_AUTHENTICATION_STARTED,
    VSCODE_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_FAILED,
    VSCODE_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_COMPLETED,
    VSCODE_EXTENSION_BAP_SERVICE_AUTHENTICATION_COMPLETED,
    VSCODE_EXTENSION_BAP_SERVICE_AUTHENTICATION_FAILED
} from "./TelemetryConstants";
import { ERRORS } from "./ErrorConstants";
import { BAP_SERVICE_SCOPE_DEFAULT, INTELLIGENCE_SCOPE_DEFAULT, PROVIDER_ID, SCOPE_OPTION_CONTACTS_READ, SCOPE_OPTION_DEFAULT, SCOPE_OPTION_OFFLINE_ACCESS, SCOPE_OPTION_USERS_READ_BASIC_ALL } from "./Constants";


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
export async function intelligenceAPIAuthentication(telemetry: ITelemetry, sessionID: string, orgId: string, firstTimeAuth = false): Promise<{ accessToken: string, user: string, userId: string }> {
    let accessToken = '';
    let user = '';
    let userId = '';
    try {
        let session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { silent: true });
        if (!session) {
            session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { createIfNone: true });
            firstTimeAuth = true;
        }
        accessToken = session?.accessToken ?? '';
        user = session.account.label;
        userId = session?.account.id.split("/").pop() ??
            session?.account.id ??
            "";
        if (!accessToken) {
            throw new Error(ERRORS.NO_ACCESS_TOKEN);
        }

        if (firstTimeAuth) {
            sendTelemetryEvent(telemetry, { eventName: CopilotLoginSuccessEvent, copilotSessionId: sessionID, orgId: orgId });
        }
    } catch (error) {
        showErrorDialog(vscode.l10n.t("Authorization Failed. Please run again to authorize it"),
            vscode.l10n.t("There was a permissions problem with the server"));
        sendTelemetryEvent(telemetry, { eventName: CopilotLoginFailureEvent, copilotSessionId: sessionID, orgId: orgId, errorMsg: (error as Error).message });
    }
    return { accessToken, user, userId };
}

export async function dataverseAuthentication(
    telemetry: ITelemetry,
    dataverseOrgURL: string,
    firstTimeAuth = false
): Promise<{ accessToken: string, userId: string }> {
    let accessToken = "";
    let userId = "";
    try {
        let session = await vscode.authentication.getSession(
            PROVIDER_ID,
            [
                `${dataverseOrgURL}${SCOPE_OPTION_DEFAULT}`,
                `${SCOPE_OPTION_OFFLINE_ACCESS}`,
            ],
            { silent: true }
        );
        if (!session) {
            session = await vscode.authentication.getSession(
                PROVIDER_ID,
                [
                    `${dataverseOrgURL}${SCOPE_OPTION_DEFAULT}`,
                    `${SCOPE_OPTION_OFFLINE_ACCESS}`,
                ],
                { createIfNone: true }
            );
        }

        accessToken = session?.accessToken ?? "";
        userId = session?.account.id.split("/").pop() ??
            session?.account.id ??
            "";
        if (!accessToken) {
            throw new Error(ERRORS.NO_ACCESS_TOKEN);
        }

        if (firstTimeAuth) {
            sendTelemetryEvent(telemetry,
                {
                    eventName: VSCODE_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED,
                    userId: userId
                }
            );
        }
    } catch (error) {
        showErrorDialog(
            vscode.l10n.t(
                "Authorization Failed. Please run again to authorize it"
            ),
            vscode.l10n.t("There was a permissions problem with the server")
        );
        sendTelemetryEvent(
            telemetry, {
            eventName: VSCODE_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED,
            errorMsg: (error as Error).message
        }
        );
    }

    return { accessToken, userId };
}

export async function npsAuthentication(
    telemetry: ITelemetry,
    cesSurveyAuthorizationEndpoint: string
): Promise<string> {
    let accessToken = "";
    sendTelemetryEvent(telemetry,
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
            throw new Error(ERRORS.NO_ACCESS_TOKEN);
        }
        sendTelemetryEvent(telemetry,
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
            telemetry,
            {
                eventName: VSCODE_EXTENSION_NPS_AUTHENTICATION_FAILED,
                errorMsg: (error as Error).message
            }
        );
    }

    return accessToken;
}

export async function graphClientAuthentication(
    telemetry: ITelemetry,
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
            throw new Error(ERRORS.NO_ACCESS_TOKEN);
        }

        if (firstTimeAuth) {
            sendTelemetryEvent(telemetry, {
                eventName: VSCODE_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_COMPLETED,
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
        sendTelemetryEvent(telemetry,
            { eventName: VSCODE_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_FAILED, errorMsg: (error as Error).message }
        )
    }

    return accessToken;
}

export async function bapServiceAuthentication(
    telemetry: ITelemetry,
    firstTimeAuth = false
): Promise<string> {
    let accessToken = "";
    try {
        let session = await vscode.authentication.getSession(
            PROVIDER_ID,
            [BAP_SERVICE_SCOPE_DEFAULT],
            { silent: true }
        );

        if (!session) {
            session = await vscode.authentication.getSession(
                PROVIDER_ID,
                [BAP_SERVICE_SCOPE_DEFAULT],
                { createIfNone: true }
            );
        }

        accessToken = session?.accessToken ?? "";
        if (!accessToken) {
            throw new Error(ERRORS.NO_ACCESS_TOKEN);
        }

        if (firstTimeAuth) {
            sendTelemetryEvent(telemetry, {
                eventName: VSCODE_EXTENSION_BAP_SERVICE_AUTHENTICATION_COMPLETED,
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
        sendTelemetryEvent(telemetry,
            { eventName: VSCODE_EXTENSION_BAP_SERVICE_AUTHENTICATION_FAILED, errorMsg: (error as Error).message }
        )
    }

    return accessToken;
}


