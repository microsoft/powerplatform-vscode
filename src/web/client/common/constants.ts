/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const PORTAL_LANGUAGES = 'adx_portallanguages';
export const WEBSITE_LANGUAGES = 'adx_websitelanguages';
export const WEBSITES = 'adx_websites';
export const SINGLE_ENTITY_URL_KEY = 'singleEntityURL';
export const SINGLE_ENTITY_LANGUAGE_KEY = 'singleEntityLanguageURL';
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
export const OLD_SCHEMA_NAME = 'portalDataverseoldschema';
export const NEW_SCHEMA_NAME = 'portalDataversenewschema';
export const NEW_PORTAL_LANGUAGES = 'powerpagesitelanguages';
export const NEW_WEBSITE_LANGUAGES = 'languagelocale';

export const columnExtension = new Map([
    ["customcss.css", "adx_customcss"],
    ["customjs.js", "adx_customjavascript"],
    ["webpage.copy.html", "adx_copy"],
    ["adx_customcss", "customcss.css"],
    ["adx_customjavascript", "customjs.js"],
    ["adx_copy", "webpage.copy.html"],
    ["summary", "webpage.copy.html"]
]);

export const entityFolder = new Map([
    ["webpages", "web-pages"],
    ["webtemplates", "web-templates"],
    ["webfiles", "web-files"],
    ["contentpages", "content-pages"],
    ["adx_webpages", "web-pages"]
]);

export const pathParamToSchema = new Map([
    ["webpages", "adx_webpages"],
    ["webtemplates", "adx_webtemplates"],
    ["adx_webpages", "adx_webpage"],
    ["adx_webtemplates", "adx_webtemplate"],
    ["adx_websites", "adx_website"],
    ["adx_portallanguages", "adx_portallanguage"],
    ["adx_websitelanguages", "adx_websitelanguage"],
    ["webfiles", "adx_webfiles"],
    ["adx_webfiles", "adx_webfile"],
    ["adx_copy", "adx_copy"]
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

export const PowerPortalComponent = new Map([
    ["publishingstate", "1"],
    ["webpage", "2"],
    ["webfile", "3"],
    ["weblinkset", "4"],
    ["weblink", "5"],
    ["pagetemplate", "6"],
    ["contentsnippet", "7"],
    ["webtemplate", "8"],
    ["sitesetting", "9"],
    ["webpageaccesscontrolrule", "10"],
    ["webrole", "11"],
    ["websiteaccess", "12"],
    ["sitemarker", "13"],
    ["tag", "14"],
    ["entityform", "15"],
    ["entityformmetadata", "16"],
    ["entitylist", "17"],
    ["entitypermission", "18"],
    ["webform", "19"],
    ["webformstep", "20"],
    ["webformmetadata", "21"],
    ["poll", "22"],
    ["polloption", "23"],
    ["pollplacement", "24"],
    ["ad", "25"],
    ["adplacement", "26"],
    ["botconsumer", "27"]
]);


