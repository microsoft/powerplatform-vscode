/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


export const ERROR_CONSTANTS = {
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
    NPS_FAILED_AUTH: "Failed to authenticate with NPS",
    PAC_AUTH_FAILED: "Failed to fetch org details from PAC",
    INVALID_FEEDBACK_INPUT: "Invalid or empty feedback input"
};
