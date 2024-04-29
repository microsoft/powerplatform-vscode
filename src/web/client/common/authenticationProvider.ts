/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { telemetryEventNames } from "../telemetry/constants";
import {
    INTELLIGENCE_SCOPE_DEFAULT,
    PROVIDER_ID,
    SCOPE_OPTION_CONTACTS_READ,
    SCOPE_OPTION_DEFAULT,
    SCOPE_OPTION_OFFLINE_ACCESS,
    SCOPE_OPTION_USERS_READ_BASIC_ALL,
} from "./constants";
import { ERRORS, showErrorDialog } from "./errorHandler";
import { ITelemetry } from "../../../client/telemetry/ITelemetry";
import { sendTelemetryEvent } from "../../../common/copilot/telemetry/copilotTelemetry";
import { CopilotLoginFailureEvent, CopilotLoginSuccessEvent } from "../../../common/copilot/telemetry/telemetryConstants";
import { getUserAgent } from "../../../common/Utils";


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
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0"
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
        const authError = (error as Error)
        showErrorDialog(vscode.l10n.t("Authorization Failed. Please run again to authorize it"),
            vscode.l10n.t("There was a permissions problem with the server"));
        sendTelemetryEvent(telemetry, { eventName: CopilotLoginFailureEvent, copilotSessionId: sessionID, orgId: orgId, error: authError });
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
            WebExtensionContext.telemetry.sendInfoTelemetry(
                telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED,
                {
                    userId: userId
                }
            );
        }
    } catch (error) {
        const authError = (error as Error)?.message;
        showErrorDialog(
            vscode.l10n.t(
                "Authorization Failed. Please run again to authorize it"
            ),
            vscode.l10n.t("There was a permissions problem with the server")
        );
        WebExtensionContext.telemetry.sendErrorTelemetry(
            telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED,
            dataverseAuthentication.name,
            authError
        );
    }

    return { accessToken, userId };
}

export async function npsAuthentication(
    cesSurveyAuthorizationEndpoint: string
): Promise<string> {
    let accessToken = "";
    WebExtensionContext.telemetry.sendInfoTelemetry(
        telemetryEventNames.NPS_AUTHENTICATION_STARTED
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
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.NPS_AUTHENTICATION_COMPLETED
        );
    } catch (error) {
        const authError = (error as Error)?.message;
        showErrorDialog(
            vscode.l10n.t(
                "Authorization Failed. Please run again to authorize it"
            ),
            vscode.l10n.t("There was a permissions problem with the server")
        );
        WebExtensionContext.telemetry.sendErrorTelemetry(
            telemetryEventNames.NPS_AUTHENTICATION_FAILED,
            npsAuthentication.name,
            authError
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
            throw new Error(ERRORS.NO_ACCESS_TOKEN);
        }

        if (firstTimeAuth) {
            WebExtensionContext.telemetry.sendInfoTelemetry(
                telemetryEventNames.WEB_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_COMPLETED,
                {
                    userId:
                        session?.account.id.split("/").pop() ??
                        session?.account.id ??
                        "",
                }
            );
        }
    } catch (error) {
        const authError = (error as Error)?.message;
        showErrorDialog(
            vscode.l10n.t(
                "Authorization Failed. Please run again to authorize it"
            ),
            vscode.l10n.t("There was a permissions problem with the server")
        );
        WebExtensionContext.telemetry.sendErrorTelemetry(
            telemetryEventNames.WEB_EXTENSION_GRAPH_CLIENT_AUTHENTICATION_FAILED,
            graphClientAuthentication.name,
            authError
        );
    }

    return accessToken;
}
