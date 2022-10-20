/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const PORTAL_LANGUAGES = 'adx_portallanguages';
export const WEBSITE_LANGUAGES = 'adx_websitelanguages';
export const WEBSITES = 'adx_websites';
export const SINGLE_ENTITY_URL_KEY = 'singleEntityURL';
export const MULTI_ENTITY_URL_KEY = 'multiEntityURL';
export const PORTAL_LANGUAGE_DEFAULT = '1033';
export const PORTALS_FOLDER_NAME = 'site';
export const PORTALS_URI_SCHEME = 'powerplatform-vfs';
export const PORTALS_WORKSPACE_NAME = 'Power Portals';
export const WEB_FILES = 'webfiles';
export const CONTENT_PAGES = 'contentpages';
export const SCHEMA = "schema";
export const WEBSITE_ID = "websiteId";
export const WEBSITE_NAME = "websiteName";
export const DEFAULT_LANGUAGE_CODE = 'en-US';
export const NO_CONTENT = ' ';
export const ORG_URL = 'orgUrl';
export const DATA_SOURCE = 'dataSource';
export const ADX_WEB_TEMPLATES = 'adx_webtemplates';
export const EMPTY_FILE_NAME = 'defaultfilename';
export const FILE_NAME_FIELD = '_primarynamefield';
export const FILE_FOLDER_NAME = '_foldername';
export const LANGUAGE_FIELD = '_languagefield';
export const CHARSET = 'utf-8';
export const PROVIDER_ID = "microsoft";
export const SCOPE_OPTION = "//.default";
export const BAD_REQUEST = 'BAD_REQUEST';
export const PUBLIC = 'public';
export const SITE_VISIBILITY = 'siteVisibility';
export const MIMETYPE = 'mimetype';
export const IS_FIRST_RUN_EXPERIENCE = 'isFirstRunExperience';

export enum httpMethod {
    PATCH = 'PATCH',
    GET = 'GET'
}

/* Generic name of the entityType passed in the URL by the clients in VSCODE URL
    Example: /powerplatform/portal/webfiles/0d877522-e316-ed11-b83f-002248310090?dataSource...
    Here webfiles is the generic name passed for all CSS files.
    These files are maintained in adx_webfile or annotations dataverse entity for PowerPages
*/
export enum vscodeUrlPathEntityName {
    WEBFILES = "webfiles",
    WEBPAGES = "webpages",
    WEBTEMPLATES = "webtemplates",
    CONTENTSNIPPET = "contentsnippet"
}

/* Corresponding name of the entityType maintained in portalSchema file
    Schema file contains properties about how to fetch/save an entity,
    and how to display it in the file explorer.
*/
export enum schemaEntityName {
    WEBFILES = "adx_webfile",
    WEBPAGES = "adx_webpage",
    WEBTEMPLATES = "adx_webtemplate",
    CONTENTSNIPPET = "adx_contentsnippet"
}

/* Corresponding name of the entityType in Dataverse entities.
    These are the OData names of the resources required for fetch and save calls.
    Example: https://<orgUrl>/api/data/v9.2/annotations?$filter=_objectid_value eq <webFileId> &$select=documentbody
    Here annotations entity has CSS file for PowerPages
*/
export enum dataverseUrlPathEntityName {
    WEBFILES = "annotations",
    WEBPAGES = "adx_webpages",
    WEBTEMPLATES = "adx_webtemplates",
    CONTENTSNIPPET = "adx_contentsnippets"
}

/*This decides the folder hierarchy a file being displayed in File explorer will follow.
    This value is also maintained in portalSchema entities definition as _exporttype*/
export enum exportType {
    SubFolders = "SubFolders",
    SingleFolder = "SingleFolder",
    SingleFile = "SingleFile"
}

// Entity attributes that need to be saved in base64 encoding - example documentBody
export enum entityAttributesWithBase64Encoding {
    documentbody = "documentbody"
}

export const columnExtension = new Map([
    ["adx_customcss", "customcss.css"],
    ["adx_customjavascript", "customjs.js"],
    ["adx_copy", "webpage.copy.html"],
    ["documentbody", "css"],
    ["adx_source", "html"],
    ["adx_value", "html"]
]);

export const pathParamToSchema = new Map([
    [vscodeUrlPathEntityName.WEBPAGES, dataverseUrlPathEntityName.WEBPAGES],
    [vscodeUrlPathEntityName.WEBFILES, dataverseUrlPathEntityName.WEBFILES],
    [vscodeUrlPathEntityName.WEBTEMPLATES, dataverseUrlPathEntityName.WEBTEMPLATES],
    [vscodeUrlPathEntityName.CONTENTSNIPPET, dataverseUrlPathEntityName.CONTENTSNIPPET],
    [dataverseUrlPathEntityName.CONTENTSNIPPET, schemaEntityName.CONTENTSNIPPET],
    [dataverseUrlPathEntityName.WEBPAGES, schemaEntityName.WEBPAGES],
    [dataverseUrlPathEntityName.WEBTEMPLATES, schemaEntityName.WEBTEMPLATES],
    ["adx_websites", "adx_website"],
    ["adx_portallanguages", "adx_portallanguage"],
    ["adx_websitelanguages", "adx_websitelanguage"],
    ["adx_webfiles", "adx_webfile"],
    ["adx_copy", "adx_copy"],
    [dataverseUrlPathEntityName.WEBFILES, schemaEntityName.WEBFILES],
]);

export enum queryParameters {
    ORG_ID = 'organizationId',
    TENANT_ID = 'tenantId',
    PORTAL_ID = 'websitePreviewId',
    WEBSITE_ID = 'websiteId',
    SCHEMA = 'schema',
    DATA_SOURCE = 'dataSource',
    REFERRER_SESSION_ID = 'referrerSessionId',
    REFERRER = 'referrer',
    SITE_VISIBILITY = 'siteVisibility'
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
