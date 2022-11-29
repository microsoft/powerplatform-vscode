/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export enum telemetryEventNames {
    WEB_EXTENSION_INIT_PATH_PARAMETERS = 'WebExtensionInitPathParameters',
    WEB_EXTENSION_INIT_QUERY_PARAMETERS = 'WebExtensionInitQueryParameters',
    WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED = 'WebExtensionDataverseAuthenticationFailed',
    WEB_EXTENSION_NO_ACCESS_TOKEN = 'WebExtensionNoAccessToken',
    WEB_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED = 'WebExtensionDataverseAuthenticationCompleted',
    WEB_EXTENSION_MANDATORY_PATH_PARAMETERS_MISSING = 'WebExtensionMandatoryPathParametersMissing',
    WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING = 'WebExtensionMandatoryQueryParametersMissing',
    WEB_EXTENSION_API_REQUEST = 'WebExtensionApiRequest',
    WEB_EXTENSION_API_REQUEST_FAILURE = 'WebExtensionApiRequestFailure',
    WEB_EXTENSION_API_REQUEST_SUCCESS = 'WebExtensionApiRequestSuccess',
    WEB_EXTENSION_EMPTY_FILE_NAME = 'WebExtensionEmptyFileName',
    WEB_EXTENSION_SET_CONTEXT_PERF = 'WebExtensionSetContextPerf',
    WEB_EXTENSION_EDIT_LCID = 'WebExtensionEditLcid',
    WEB_EXTENSION_EDIT_LANGUAGE_CODE = 'WebExtensionEditLanguageCode',
    WEB_EXTENSION_VSCODE_START_COMMAND = 'WebExtensionVscodeStartCommand',
}
