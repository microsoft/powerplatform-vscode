/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";
import { ORG_URL, DATA_SOURCE, PORTALS_FOLDER_NAME, SCHEMA, WEBSITE_ID, WEBSITE_NAME } from "./constants";

export const ERRORS = {
    WORKSPACE_INITIAL_LOAD: "Error Initializing Workspace",
    VSCODE_INITIAL_LOAD: "Error Initializing Platform",
    APP_NAME_NOT_AVAILABLE: "Please specify the appName",
    UNKNOWN_APP: "Unknown app, Please add authentication flow for this app",
    AUTHORIZATION_FAILED: "Authorization Failed. Please run again to authorize it",
    FILE_NOT_FOUND: "File Not Found",
    RETRY_LIMIT_EXCEEDED: "Retry Limit Exceeded",
    PRECONDITION_CHECK_FAILED: "Precondition check failed",
    SERVER_ERROR_RETRY_LATER: "We're sorry, a server error occurred. Please wait a bit and try again",
    AUTHORIZATION_REQUIRED: "Authorization is required to perform that action. Please run again to authorize it",
    SERVER_ERROR_PERMISSION_DENIED: "We're sorry, a server error occurred while reading from storage. Error code PERMISSION_DENIED",
    EMPTY_RESPONSE: "Empty Response",
    BAD_VALUE: "Bad Value",
    LIMIT_EXCEEDED: "Limit Exceeded",
    THRESHOLD_LIMIT_EXCEEDED: "Threshold Rate Limit Exceeded",
    RATE_LIMIT_EXCEEDED: "Rate Limit Exceeded",
    NOT_FOUND: "Not Found",
    BAD_REQUEST: "Bad Request",
    BACKEND_ERROR: "Backend Error",
    SERVICE_UNAVAILABLE: "Service unavailable",
    SERVICE_ERROR: "Service error",
    INVALID_ARGUMENT: 'Invalid argument',
    MANDATORY_PARAMETERS_NULL: "Mandatory Parameters Cannot Be Null",
    MANDATORY_PARAMETERS_UNAVAILABLE: "Mandatory Parameters required for editing are not available",
    FILE_NAME_NOT_SET: "Error Creating File as File Name Not Specified"
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
                showErrorDialog(ERRORS.WORKSPACE_INITIAL_LOAD, ERRORS.MANDATORY_PARAMETERS_UNAVAILABLE);
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
                showErrorDialog(ERRORS.WORKSPACE_INITIAL_LOAD, ERRORS.MANDATORY_PARAMETERS_UNAVAILABLE);
                return false;
            }
        }
        default:
            return false;
    }
}
