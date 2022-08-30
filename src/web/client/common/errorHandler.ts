/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";
import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import { sendErrorTelemetry } from "../telemetry/webExtensionTelemetry";
import { ORG_URL, DATA_SOURCE, PORTALS_FOLDER_NAME, SCHEMA, WEBSITE_ID, WEBSITE_NAME, telemetryEventNames } from "./constants";

export const ERRORS = {
    WORKSPACE_INITIAL_LOAD: "There was a problem opening the workspace",
    WORKSPACE_INITIAL_LOAD_DESC: "Try refreshing the browser",
    UNKNOWN_APP: "Unable to find that app",
    AUTHORIZATION_FAILED: "Authorization Failed. Please run again to authorize it",
    FILE_NOT_FOUND: "The file was not found",
    RETRY_LIMIT_EXCEEDED: "Unable to complete that operation",
    RETRY_LIMIT_EXCEEDED_DESC: "You've exceeded the retry limit ",
    PRECONDITION_CHECK_FAILED: "The precondition check did not work",
    PRECONDITION_CHECK_FAILED_DESC: "Try again",
    SERVER_ERROR_RETRY_LATER: "There was a problem with the server",
    SERVER_ERROR_RETRY_LATER_DESC: "Please try again in a minute or two",
    SERVER_ERROR_PERMISSION_DENIED: "There was a permissions problem with the server",
    SERVER_ERROR_PERMISSION_DENIED_DESC: "Please try again in a minute or two",
    EMPTY_RESPONSE: "There was no response",
    EMPTY_RESPONSE_DESC: "Try again",
    THRESHOLD_LIMIT_EXCEEDED: "Threshold for dataverse api",
    THRESHOLD_LIMIT_EXCEEDED_DESC: "You’ve exceeded the threshold rate limit for the Dataverse API",
    BAD_REQUEST: "Unable to complete the request",
    BAD_REQUEST_DESC: "One or more attribute names have been changed or removed. Contact your admin.",
    //BACKEND_ERROR: "There’s a problem on the back end",
    SERVICE_UNAVAILABLE: "There’s a problem connecting to Dataverse",
    SERVICE_ERROR: "There’s a problem connecting to Dataverse",
    INVALID_ARGUMENT: "One or more commands are invalid or malformed",
    //BACKEND_ERROR_DESC: "Try again",
    SERVICE_UNAVAILABLE_DESC: "Try again",
    SERVICE_ERROR_DESC: "Try again",
    INVALID_ARGUMENT_DESC: "Check the parameters and try again",
    MANDATORY_PARAMETERS_NULL: "The workspace is not available ",
    MANDATORY_PARAMETERS_NULL_DESC: "Check the URL and verify the parameters are correct",
    FILE_NAME_NOT_SET: "That file is not available",
    FILE_NAME_NOT_SET_DESC: "The metadata may have changed on the Dataverse side. Contact your admin. {message_attribute}",
    GENERIC_ERROR: "Error encountered..."
};

export function showErrorDialog(detailMessage: string, errorString: string) {
    const options = { detail: detailMessage, modal: true };
    vscode.window.showErrorMessage(errorString, options);
}

export function removeEncodingFromParameters(queryParamsMap: Map<string, string>) {
    //NOTE: From extensibility perspective split attributes and attributes may contain encoded string which must be decoded before use.
    const schemaFileName = decodeURI(queryParamsMap.get(SCHEMA) as string);
    queryParamsMap.set(SCHEMA, schemaFileName);
    const websiteName = decodeURI(queryParamsMap.get(WEBSITE_NAME) as string);
    const portalFolderName = websiteName ? websiteName : PORTALS_FOLDER_NAME;
    queryParamsMap.set(WEBSITE_NAME, portalFolderName);
}

export function checkMandatoryParameters(appName: string, entity: string, entityId: string, queryParamsMap: Map<string, string>): boolean {
    return checkMandatoryPathParameters(appName, entity, entityId) && checkMandatoryQueryParameters(appName, queryParamsMap);
}

export function checkMandatoryPathParameters(appName: string, entity: string, entityId: string): boolean {
    switch (appName) { // remove switch cases and use polymorphism
        case 'portal':
            if (entity && entityId) { // this will change when we start supporting multi-entity edits
                return true;
            } else {
                sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_MANDATORY_PATH_PARAMETERS_MISSING);
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.init.workspace.error", "There was a problem opening the workspace"), localize("microsoft-powerapps-portals.webExtension.init.workspace.error.desc", "Check the URL and verify the parameters are correct"));
                return false;
            }
        default:
            return false;
    }
}

export function checkMandatoryQueryParameters(appName: string, queryParamsMap: Map<string, string>): boolean {
    switch (appName) { // remove switch cases and use polymorphism
        case 'portal': {
            const orgURL = queryParamsMap?.get(ORG_URL);
            const dataSource = queryParamsMap?.get(DATA_SOURCE);
            const schemaName = queryParamsMap?.get(SCHEMA);
            const websiteId = queryParamsMap?.get(WEBSITE_ID);
            if (orgURL && dataSource && schemaName && websiteId) {
                return true;
            } else {
                sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING);
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "There was a problem opening the workspace"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the URL and verify the parameters are correct"));
                return false;
            }
        }
        default:
            return false;
    }
}
