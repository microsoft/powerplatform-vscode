/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { schemaKey } from "../schema/constants";
import { webExtensionTelemetryEventNames } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { queryParameters } from "./constants";
import { showErrorDialog } from "../../../common/utilities/errorHandlerUtil";

export function removeEncodingFromParameters(
    queryParamsMap: Map<string, string>
) {
    //NOTE: From extensibility perspective split attributes and attributes may contain encoded string which must be decoded before use.
    const schemaFileName = decodeURI(
        queryParamsMap.get(schemaKey.SCHEMA_VERSION) as string
    );
    queryParamsMap.set(schemaKey.SCHEMA_VERSION, schemaFileName);
}

export function checkMandatoryParameters(
    appName: string,
    queryParamsMap: Map<string, string>
): boolean {
    return (
        checkMandatoryPathParameters(appName) &&
        checkMandatoryQueryParameters(appName, queryParamsMap)
    );
}

export function checkMandatoryPathParameters(
    appName: string,
): boolean {
    switch (
    appName // remove switch cases and use polymorphism
    ) {
        case "portal":
            return true;
        default:
            showErrorDialog(
                vscode.l10n.t("There was a problem opening the workspace"),
                vscode.l10n.t("Unable to find that app")
            );
            return false;
    }
}

export function checkMandatoryQueryParameters(
    appName: string,
    queryParamsMap: Map<string, string>
): boolean {
    switch (
    appName // remove switch cases and use polymorphism
    ) {
        case "portal": {
            const orgId = queryParamsMap?.get(queryParameters.ORG_ID);
            const portalId = queryParamsMap?.get(queryParameters.PORTAL_ID);
            const envId = queryParamsMap?.get(queryParameters.ENV_ID);
            if (orgId && portalId && envId) {
                return true;
            } else {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
                    checkMandatoryQueryParameters.name,
                    `orgId:${orgId}, portalId:${portalId}, envId:${envId}`
                );
                showErrorDialog(
                    vscode.l10n.t("There was a problem opening the workspace"),
                    vscode.l10n.t("Check the URL and verify the parameters are correct")
                );
                return false;
            }
        }
        default:
            showErrorDialog(
                vscode.l10n.t("There was a problem opening the workspace"),
                vscode.l10n.t("Unable to find that app")
            );
            return false;
    }
}
