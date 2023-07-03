/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// Default and constants
export const PORTAL_LANGUAGE_DEFAULT = "1033";
export const PORTALS_FOLDER_NAME_DEFAULT = "site";
export const PORTALS_URI_SCHEME = "powerplatform-vfs";
export const DEFAULT_LANGUAGE_CODE = " ";
export const NO_CONTENT = " ";
export const EMPTY_FILE_NAME = "defaultfilename";
export const CHARSET = "utf-8";
export const PROVIDER_ID = "microsoft";
export const SCOPE_OPTION_DEFAULT = "//.default";
export const SCOPE_OPTION_OFFLINE_ACCESS = "offline_access";
export const BAD_REQUEST = "BAD_REQUEST";
export const PUBLIC = "public";
export const MIMETYPE = "mimetype";
export const IS_FIRST_RUN_EXPERIENCE = "isFirstRunExperience";
export const ODATA_ETAG = "@odata.etag";
export const ODATA_NEXT_LINK = "@odata.nextLink";
export const ODATA_COUNT = "@odata.count";
export const MAX_ENTITY_FETCH_COUNT = 1000;
export const MAX_CONCURRENT_REQUEST_COUNT = 50;
export const MAX_CONCURRENT_REQUEST_QUEUE_COUNT = 1000;

// Web extension constants
export const BASE_64= 'base64';
export const DATA = 'data';
export const ALL_DOCUMENT_MIME_TYPE =
  '.doc,.dot,.wbk,.docx,.docm,.dotx,.dotm,.docb,.xls,.xlt,.xlm,.xlsx,.xlsm,.xltx,.xltm,.ppt,.pot,.pps,.pptx,.pptm,.potx,.potm,.ppam,.ppsx,.ppsm,.sldx,.sldm,.pdf';
export const ALL_DOCUMENT_MIME_TYPE_SHORTENED =
  '.doc,.dot,.docx,.docm,.xls,.xlt,.xlm,.xlsx,.xlsm,.xltm,.ppt,.pptx,.pptm,.pdf';
export const ALL_AUDIO_MIME_TYPE = 'audio/';
export const ALL_IMAGE_MIME_TYPE = 'image/';
export const ALL_VIDEO_MIME_TYPE = 'video/';
export const ALL_TEXT_MIME_TYPE = 'text/';
export const ALL_APPLICATION_MIME_TYPE = 'application/';

// FEATURE FLAGS
// Version control feature flag
export const VERSION_CONTROL_FOR_WEB_EXTENSION_SETTING_NAME =
    "enableVersionControl";

// Multi-file feature constants
export const MULTI_FILE_FEATURE_SETTING_NAME = "enableMultiFileFeature";

export enum initializationEntityName {
    WEBSITE = "websites",
    WEBSITELANGUAGE = "websitelanguages",
    PORTALLANGUAGE = "portallanguages",
}

// Query parameters passed in url to vscode extension
export enum queryParameters {
    ORG_ID = "organizationid",
    TENANT_ID = "tenantid",
    PORTAL_ID = "websitepreviewid",
    WEBSITE_ID = "websiteid",
    SCHEMA = "schema",
    DATA_SOURCE = "datasource",
    REFERRER_SESSION_ID = "referrersessionid",
    REFERRER = "referrer",
    SITE_VISIBILITY = "sitevisibility",
    WEBSITE_NAME = "websitename",
    ORG_URL = "orgurl",
    REGION = "region",
    ENV_ID = "envid",
    GEO = "geo",
    ENABLE_MULTIFILE = "enablemultifile",
}

export enum httpMethod {
    PATCH = "PATCH",
    GET = "GET",
    POST = "POST",
}

export enum SurveyConstants {
    TEAM_NAME = "PowerPages",
    SURVEY_NAME = "PowerPages-NPS",
    EVENT_NAME = "VscodeWeb",
    AUTHORIZATION_ENDPOINT = "https://microsoft.onmicrosoft.com/cessurvey/user",
}
