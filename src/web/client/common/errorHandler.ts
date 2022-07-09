/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as vscode from "vscode";
import { ORG_URL, SCHEMA_FIELD_NAME, WEBSITE_ID } from "./constants";

export const ERRORS = {
    WORKSPACE_INITIAL_LOAD: "Error Initializing Workspace",
    VSCODE_INITIAL_LOAD: "Error Initializing Platform",
    APP_NAME_NOT_AVAILABLE: "Please specify the appName",
    UNKNOWN_APP: "Unknown app, Please add authentication flow for this app",
    AUTHORIZATION_FAILED: "Authorization Failed. Please run again to authorize it.",
    FILE_NOT_FOUND: "File Not Found",
    RETRY_LIMIT_EXCEEDED: " Retry Limit Exceeded.",
    PRECONDITION_CHECK_FAILED: "Precondition check failed.",
    SERVER_ERROR_RETRY_LATER: "We're sorry, a server error occurred. Please wait a bit and try again.",
    AUTHORIZATION_REQUIRED: "Authorization is required to perform that action. Please run again to authorize it.",
    SERVER_ERROR_PERMISSION_DENIED: "We're sorry, a server error occurred while reading from storage. Error code PERMISSION_DENIED.",
    EMPTY_RESPONSE: "Empty Response",
    BAD_VALUE: "Bad Value",
    LIMIT_EXCEEDED: "Limit Exceeded: .",
    THRESHOLD_LIMIT_EXCEEDED: "Threshold Rate Limit Exceeded",
    RATE_LIMIT_EXCEEDED: "Rate Limit Exceeded",
    NOT_FOUND: "Not Found",
    BAD_REQUEST: "Bad Request",
    BACKEND_ERROR: "Backend Error",
    SERVICE_UNAVAILABLE: "Service unavailable",
    SERVICE_ERROR: "Service error",
    INVALID_ARGUMENT: 'Invalid argument',
    MANDATORY_PARAMETERS_NULL: 'Mandatory Parameters Cannot Be Null',
    FILE_NAME_NOT_SET: "Error Creating File as File Name Not Specified"
};

export function showErrorDialog(detailMessage: string, errorString: string) {
    const options = { detail: detailMessage, modal: true };
    vscode.window.showErrorMessage(errorString, options);
}

export function checkString(s: string | undefined) {
    if (typeof (s) !== 'string' && s !== undefined) {
        showErrorDialog(ERRORS.WORKSPACE_INITIAL_LOAD, ERRORS.MANDATORY_PARAMETERS_NULL);
        throw new Error(ERRORS.MANDATORY_PARAMETERS_NULL);
    }
}

export function checkMap(d: Map<any, any>) {
    if (d.size == 0 || d === undefined) {
        showErrorDialog(ERRORS.WORKSPACE_INITIAL_LOAD, ERRORS.MANDATORY_PARAMETERS_NULL);
        throw new Error(ERRORS.MANDATORY_PARAMETERS_NULL);
    }
}

export function checkParameters(queryParamsMap: Map<string, string>, entity: string) {
    checkMap(queryParamsMap);
    checkString(entity);
    checkString(queryParamsMap.get(WEBSITE_ID));
    checkString(queryParamsMap.get(SCHEMA_FIELD_NAME));
    const dataverseOrgUrl = queryParamsMap.get(ORG_URL) as string;
    checkString(dataverseOrgUrl);
}
