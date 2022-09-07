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
export const DEFAULT_LANGUAGE_CODE = ' ';
export const NO_CONTENT = ' ';
export const ORG_URL = 'orgUrl';
export const DATA_SOURCE = 'dataSource';
export const ADX_WEB_TEMPLATES = 'adx_webtemplates';
export const EMPTY_FILE_NAME = 'defaultfilename';
export const FILE_NAME_FIELD = '_primarynamefield';
export const CHARSET = 'utf-8';
export const PROVIDER_ID = "microsoft";
export const SCOPE_OPTION = "//.default";
export const BAD_REQUEST = 'BAD_REQUEST';
export const PUBLIC = 'public';
export const SITE_VISIBILITY = 'siteVisibility';
export const MIMETYPE = 'mimetype';

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
    WEBTEMPLATES = "webtemplates"
}

/* Corresponding name of the entityType maintained in portalSchema file
    Schema file contains properties about how to fetch/save an entity,
    and how to display it in the file explorer.
*/
export enum schemaEntityName {
    WEBFILES = "adx_webfile",
    WEBPAGES = "adx_webpage",
    WEBTEMPLATES = "adx_webtemplate"
}

/* Corresponding name of the entityType in Dataverse entities.
    These are the OData names of the resources required for fetch and save calls.
    Example: https://<orgUrl>/api/data/v9.2/annotations?$filter=_objectid_value eq <webFileId> &$select=documentbody
    Here annotations entity has CSS file for PowerPages
*/
export enum dataverseUrlPathEntityName {
    WEBFILES = "annotations",
    WEBPAGES = "adx_webpages",
    WEBTEMPLATES = "adx_webtemplates"
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
    ["customcss.css", "adx_customcss"],
    ["customjs.js", "adx_customjavascript"],
    ["webpage.copy.html", "adx_copy"],
    ["adx_customcss", "customcss.css"],
    ["adx_customjavascript", "customjs.js"],
    ["adx_copy", "webpage.copy.html"],
    ["documentbody", "css"]
]);

export const entityFolder = new Map([
    ["webpages", "web-pages"],
    ["webtemplates", "web-templates"],
    ["annotations", "web-files"],
    ["contentpages", "content-pages"],
    ["adx_webpages", "web-pages"]
]);

export const pathParamToSchema = new Map([
    [vscodeUrlPathEntityName.WEBPAGES, "adx_webpages"],
    [vscodeUrlPathEntityName.WEBFILES, "annotations"],
    [vscodeUrlPathEntityName.WEBTEMPLATES, "adx_webtemplates"],
    ["adx_webpages", "adx_webpage"],
    ["adx_webtemplates", "adx_webtemplate"],
    ["adx_websites", "adx_website"],
    ["adx_portallanguages", "adx_portallanguage"],
    ["adx_websitelanguages", "adx_websitelanguage"],
    ["adx_webfiles", "adx_webfile"],
    ["adx_copy", "adx_copy"],
    ["annotations", "adx_webfile"],
]);

export enum queryParameters {
    ORG_URL = 'orgUrl',
    WEBSITE_ID = 'websiteId',
    SCHEMA = 'schema',
    DATA_SOURCE = 'dataSource',
    REFERRER_SESSION_ID = 'referrerSessionId',
    REFERRER = 'referrer'
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
}
