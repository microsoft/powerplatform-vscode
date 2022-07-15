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
export const PORTALS_FOLDER_NAME = 'StarterPortal';
export const PORTALS_URI_SCHEME = 'portals';
export const PORTALS_WORKSPACE_NAME = 'Power Portals';
export const WEB_FILES = 'webfiles';
export const CONTENT_PAGES = 'contentpages';
export const SCHEMA_FIELD_NAME = "schema";
export const WEBSITE_ID = "websiteId";
export const DEFAULT_LANGUAGE_CODE = 'en_US';
export const NO_CONTENT = ' ';
export const ORG_URL = 'orgUrl';
export const ADX_WEB_TEMPLATES = 'adx_webtemplates';
export const EMPTY_FILE_NAME = 'defaultfilename';
export const FILE_NAME_FIELD = '_primarynamefield';
export const CHARSET = 'utf-8';
export const PROVIDER_ID = "microsoft";
export const SCOPE_OPTION = "//.default";

export const columnExtension = new Map([
    ["customcss.cs", "adx_customcss"],
    ["customjs.js", "adx_customjavascript"],
    ["webpage.copy.html", "adx_copy"],
    ["adx_customcss", "customcss.cs"],
    ["adx_customjavascript", "customjs.js"],
    ["adx_copy", "webpage.copy.html"]
]);

export const entityFolder = new Map([
    ["webpages", "web-pages"],
    ["webtemplates", "web-templates"],
    ["webfiles", "web-files"],
    ["contentpages", "content-pages"],
    ["adx_webpages", "web-pages"]
]);

export enum appTypes {
    portal = 0,
    default = 1
}

export enum dataSource {
    dataverse = 0,
    github = 1
}

export enum fileExtension {
    html = 0,
    css = 1,
    js = 2
}

export const pathParamToSchema = new Map([
    ["webpages", "adx_webpages"],
    ["webtemplates", "adx_webtemplates"],
    ["adx_webpages", "adx_webpage"],
    ["adx_webtemplates", "adx_webtemplate"],
    ["adx_websites", "adx_website"],
    ["adx_portallanguages", "adx_portallanguage"],
    ["webfiles", "adx_webfiles"],
    ["adx_webfiles", "adx_webfile"],
    ["adx_copy", "adx_copy"]
]);
