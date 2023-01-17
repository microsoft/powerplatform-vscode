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
export const SCOPE_OPTION_DEFAULT = "//.default";
export const SCOPE_OPTION_OFFLINE_ACCESS = "offline_access";
export const BAD_REQUEST = 'BAD_REQUEST';
export const PUBLIC = 'public';
export const MIMETYPE = 'mimetype';
export const IS_FIRST_RUN_EXPERIENCE = 'isFirstRunExperience';
export const ODATA_ETAG = "@odata.etag";

export enum initializationEntityName {
    WEBSITE = "websites",
    WEBSITELANGUAGE = "websitelanguages",
    PORTALLANGUAGE = "portallanguages"
}

// Query parameters passed in url to vscode extension
export enum queryParameters {
    ORG_ID = 'organizationid',
    TENANT_ID = 'tenantid',
    PORTAL_ID = 'websitepreviewid',
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
