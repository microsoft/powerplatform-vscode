/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { schemaKey } from "../schema/constants";
import { telemetryEventNames } from "../telemetry/constants";
import { PORTALS_FOLDER_NAME_DEFAULT, queryParameters } from "./constants";
import { isMultifileEnabled } from "../utilities/commonUtil";

export const ERRORS = {
    SUBURI_EMPTY: "SubURI value for entity file is empty",
    NO_ACCESS_TOKEN: "No access token was created",
    PORTAL_FOLDER_NAME_EMPTY: "portalFolderName value for entity file is empty",
    ATTRIBUTES_EMPTY: "Entity file attribute or extension field empty",
    WORKSPACE_INITIAL_LOAD: "There was a problem opening the workspace",
    WORKSPACE_INITIAL_LOAD_DESC: "Try refreshing the browser",
    UNKNOWN_APP: "Unable to find that app",
    AUTHORIZATION_FAILED:
        "Authorization Failed. Please run again to authorize it",
    FILE_NOT_FOUND: "The file was not found",
    RETRY_LIMIT_EXCEEDED: "Unable to complete that operation",
    RETRY_LIMIT_EXCEEDED_DESC: "You've exceeded the retry limit ",
    PRECONDITION_CHECK_FAILED: "The precondition check did not work",
    PRECONDITION_CHECK_FAILED_DESC: "Try again",
    SERVER_ERROR_RETRY_LATER: "There was a problem with the server",
    SERVER_ERROR_RETRY_LATER_DESC: "Please try again in a minute or two",
    SERVER_ERROR_PERMISSION_DENIED:
        "There was a permissions problem with the server",
    SERVER_ERROR_PERMISSION_DENIED_DESC: "Please try again in a minute or two",
    EMPTY_RESPONSE: "There was no response",
    EMPTY_RESPONSE_DESC: "Try again",
    THRESHOLD_LIMIT_EXCEEDED: "Threshold for dataverse api",
    THRESHOLD_LIMIT_EXCEEDED_DESC:
        "You’ve exceeded the threshold rate limit for the Dataverse API",
    BAD_REQUEST: "Unable to complete the request",
    BAD_REQUEST_DESC:
        "One or more attribute names have been changed or removed. Contact your admin.",
    BACKEND_ERROR: "There’s a problem on the back end",
    SERVICE_UNAVAILABLE: "There’s a problem connecting to Dataverse",
    SERVICE_ERROR: "There’s a problem connecting to Dataverse",
    INVALID_ARGUMENT: "One or more commands are invalid or malformed",
    BACKEND_ERROR_DESC: "Try again",
    SERVICE_UNAVAILABLE_DESC: "Try again",
    SERVICE_ERROR_DESC: "Try again",
    INVALID_ARGUMENT_DESC: "Check the parameters and try again",
    MANDATORY_PARAMETERS_NULL: "The workspace is not available ",
    MANDATORY_PARAMETERS_NULL_DESC:
        "Check the URL and verify the parameters are correct",
    FILE_NAME_NOT_SET: "That file is not available",
    FILE_NAME_NOT_SET_DESC:
        "The metadata may have changed in the Dataverse side. Contact your admin. {message_attribute}",
    FILE_NAME_EMPTY: "File name is empty",
    FILE_ID_EMPTY: "File ID is empty",
    LANGUAGE_CODE_ID_VALUE_NULL: "Language code ID is empty",
    LANGUAGE_CODE_EMPTY: "Language code is empty",
    BULKHEAD_LIMITS_EXCEEDED: "Bulkhead queue limits exceeded",
};

export function showErrorDialog(errorString: string, detailMessage?: string) {
    const options = { detail: detailMessage, modal: true };
    vscode.window.showErrorMessage(errorString, options);
}

export function removeEncodingFromParameters(
    queryParamsMap: Map<string, string>
) {
    //NOTE: From extensibility perspective split attributes and attributes may contain encoded string which must be decoded before use.
    const schemaFileName = decodeURI(
        queryParamsMap.get(schemaKey.SCHEMA_VERSION) as string
    );
    queryParamsMap.set(schemaKey.SCHEMA_VERSION, schemaFileName);
    const websiteName = decodeURI(
        queryParamsMap.get(queryParameters.WEBSITE_NAME) as string
    );
    const portalFolderName = websiteName
        ? websiteName
        : PORTALS_FOLDER_NAME_DEFAULT;
    queryParamsMap.set(queryParameters.WEBSITE_NAME, portalFolderName);
}

export function checkMandatoryParameters(
    appName: string,
    queryParamsMap: Map<string, string>
): boolean {
    return (
        checkMandatoryPathParameters(appName) &&
        checkMandatoryQueryParameters(appName, queryParamsMap) &&
        checkMandatoryMultifileParameters(appName, queryParamsMap)
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
            const orgURL = queryParamsMap?.get(queryParameters.ORG_URL);
            const dataSource = queryParamsMap?.get(queryParameters.DATA_SOURCE);
            const schemaName = queryParamsMap?.get(schemaKey.SCHEMA_VERSION);
            const websiteId = queryParamsMap?.get(queryParameters.WEBSITE_ID);
            if (orgURL && dataSource && schemaName && websiteId) {
                return true;
            } else {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
                    checkMandatoryQueryParameters.name,
                    `${orgURL ? `orgURL, ` : ``}dataSource:${dataSource}, schemaName:${schemaName} ,websiteId:${websiteId}`
                );
                showErrorDialog(
                    vscode.l10n.t("There was a problem opening the workspace"),
                    vscode.l10n.t(
                        "Check the URL and verify the parameters are correct"
                    )
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

export function checkMandatoryMultifileParameters(
    appName: string,
    queryParametersMap: Map<string, string>
): boolean {
    switch (
    appName // remove switch cases and use polymorphism
    ) {
        case "portal": {
            const enableMultifile = queryParametersMap?.get(queryParameters.ENABLE_MULTIFILE);
            const isEnableMultifile = (String(enableMultifile).toLowerCase() === 'true');
            const websiteId = queryParametersMap.get(queryParameters.WEBSITE_ID);
            if ((isMultifileEnabled() && isEnableMultifile && websiteId)
                || (isMultifileEnabled() && !isEnableMultifile)
                || !isMultifileEnabled()) {
                return true;
            } else {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_MULTI_FILE_MANDATORY_PARAMETERS_MISSING,
                    checkMandatoryMultifileParameters.name,
                    `enableMultifile:${enableMultifile}, websiteId:${websiteId}`
                );
                showErrorDialog(
                    vscode.l10n.t("There was a problem opening the workspace"),
                    vscode.l10n.t(
                        "Check the URL and verify the parameters are correct"
                    )
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
