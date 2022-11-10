/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// Default and constants
export const PORTAL_LANGUAGE_DEFAULT = '1033';
export const PORTALS_FOLDER_NAME_DEFAULT = 'site';
export const PORTALS_URI_SCHEME = 'powerplatform-vfs';
export const DEFAULT_LANGUAGE_CODE = ' ';
export const NO_CONTENT = ' ';
export const EMPTY_FILE_NAME = 'defaultfilename';
export const CHARSET = 'utf-8';
export const PROVIDER_ID = "microsoft";
export const SCOPE_OPTION = "//.default";
export const BAD_REQUEST = 'BAD_REQUEST';
export const PUBLIC = 'public';
export const MIMETYPE = 'mimetype';
export const IS_FIRST_RUN_EXPERIENCE = 'isFirstRunExperience';

export enum schemaKey {
    SINGLE_ENTITY_URL = 'singleEntityURL',
    MULTI_ENTITY_URL = 'multiEntityURL',
    SCHEMA_VERSION = 'schema',
    DATAVERSE_API_VERSION = 'version',
    DATA = 'data',
    API = 'api'
}

export enum schemaEntityKey {
    FILE_NAME_FIELD = '_primarynamefield',
    FILE_FOLDER_NAME = '_foldername',
    LANGUAGE_FIELD = '_languagefield',
    ATTRIBUTES_EXTENSION = '_attributesExtension',
    DATAVERSE_ENTITY_NAME = '_dataverseenityname',
    FETCH_QUERY_PARAMETERS = '_fetchQueryParameters',
    MAPPING_ENTITY_ID = '_mappingEntityId',
    MAPPING_ATTRIBUTE_FETCH_QUERY = '_mappingAttributeFetchQuery'
}

export enum initializationEntityName {
    WEBSITE = "websites",
    WEBSITELANGUAGE = "websitelanguages",
    PORTALLANGUAGE = "portallanguages"
}

// Query parameters passed in url to vscode extension
export enum queryParameters {
    ORG_ID = 'organizationid',
    TENANT_ID = 'tenantid',
    PORTAL_ID = 'websitePreviewid',
    WEBSITE_ID = 'websiteid',
    SCHEMA = 'schema',
    DATA_SOURCE = 'datasource',
    REFERRER_SESSION_ID = 'referrersessionid',
    REFERRER = 'referrer',
    SITE_VISIBILITY = 'sitevisibility',
    WEBSITE_NAME = 'websitename',
    ORG_URL = 'orgurl'
}

export enum httpMethod {
    PATCH = 'PATCH',
    GET = 'GET'
}

export enum schemaEntityName {
    WEBFILES = "webfiles",
    WEBPAGES = "webpages",
    WEBTEMPLATES = "webtemplates",
    CONTENTSNIPPETS = "contentsnippet"
}

// This decides the folder hierarchy a file being displayed in File explorer will follow.
// This value is also maintained in portalSchema entities definition as _exporttype
export enum exportType {
    SubFolders = "SubFolders",
    SingleFolder = "SingleFolder",
    SingleFile = "SingleFile"
}

// Entity attributes that need to be saved in base64 encoding - example documentBody
export enum entityAttributesWithBase64Encoding {
    documentbody = "documentbody",
    filecontent = "filecontent"
}

export enum telemetryEventNames {
    WEB_EXTENSION_INIT_PATH_PARAMETERS = 'WebExtensionInitPathParameters',
    WEB_EXTENSION_INIT_QUERY_PARAMETERS = 'WebExtensionInitQueryParameters',
    WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED = 'WebExtensionDataverseAuthenticationFailed',
    WEB_EXTENSION_NO_ACCESS_TOKEN = 'WebExtensionNoAccessToken',
    WEB_EXTENSION_MANDATORY_PATH_PARAMETERS_MISSING = 'WebExtensionMandatoryPathParametersMissing',
    WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING = 'WebExtensionMandatoryQueryParametersMissing',
    WEB_EXTENSION_API_REQUEST = 'WebExtensionApiRequest',
    WEB_EXTENSION_API_REQUEST_FAILURE = 'WebExtensionApiRequestFailure',
    WEB_EXTENSION_API_REQUEST_SUCCESS = 'WebExtensionApiRequestSuccess',
    WEB_EXTENSION_EMPTY_FILE_NAME = 'WebExtensionEmptyFileName',
    WEB_EXTENSION_SET_CONTEXT_PERF = 'WebExtensionSetContextPerf',
    WEB_EXTENSION_EDIT_LCID = 'WebExtensionEditLcid',
    WEB_EXTENSION_EDIT_LANGUAGE_CODE = 'WebExtensionEditLanguageCode',
}
