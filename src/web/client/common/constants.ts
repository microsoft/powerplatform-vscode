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
export const BAD_REQUEST = "BAD_REQUEST";
export const PUBLIC = "public";
export const MIMETYPE = "mimetype";
export const IS_FIRST_RUN_EXPERIENCE = "isFirstRunExperience";
export const IS_MULTIFILE_FIRST_RUN_EXPERIENCE = "isMultiFileFirstRunExperience";
export const ODATA_ETAG = "@odata.etag";
export const ODATA_NEXT_LINK = "@odata.nextLink";
export const ODATA_COUNT = "@odata.count";
export const MAX_ENTITY_FETCH_COUNT = 100;
export const MAX_CONCURRENT_REQUEST_COUNT = 50;
export const MAX_CONCURRENT_REQUEST_QUEUE_COUNT = 1000;
export const BACK_TO_STUDIO_URL_TEMPLATE = "https://make{.region}.powerpages.microsoft.com/e/{environmentId}/sites/{webSiteId}/pages";
export const STUDIO_PROD_REGION = "prod";
export const ARTEMIS_RESPONSE_FAILED = "Artemis response failed";
export const WEB_EXTENSION_GET_FROM_GRAPH_CLIENT_FAILED = "Web extension get from graph client failed";
export const WEB_EXTENSION_FETCH_WORKER_SCRIPT_FAILED = "Web extension fetch worker script failed";
export const WEB_EXTENSION_POPULATE_SHARED_WORKSPACE_SYSTEM_ERROR = "Web extension populate shared workspace system error";
export const WEB_EXTENSION_WEB_WORKER_REGISTRATION_FAILED = "Web extension web worker registration failed";
export const WEB_EXTENSION_FETCH_GET_OR_CREATE_SHARED_WORK_SPACE_ERROR = "Web extension fetch get or create shared workspace error";
export const WEB_EXTENSION_QUICK_PICK_DEFAULT_STRING = "No users are currently viewing this page";

// Web extension constants
export const BASE_64 = 'base64';
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

// Co-presence feature constants
export const CO_PRESENCE_FEATURE_SETTING_NAME = "enableCoPresenceFeature";

// Co-presence constants
export const GET_OR_CREATE_SHARED_WORK_SPACE = "/api/data/v9.2/GetOrCreateSharedWorkspace";

export enum sharedWorkspaceParameters {
    SHAREWORKSPACE_ID = "sharedworkspaceid",
    TENANT_ID = "tenantid",
    ACCESS_TOKEN = "accesstoken",
    DISCOVERY_ENDPOINT = "discoveryendpoint",
}

export enum workerEventMessages {
    UPDATE_CONNECTED_USERS = "client-data",
    REMOVE_CONNECTED_USER = "member-removed",
    SEND_INFO_TELEMETRY = "telemetry-info",
    SEND_ERROR_TELEMETRY = "telemetry-error",
}

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
    GEO = "geo", // User geo location
    ENABLE_MULTIFILE = "enablemultifile",
    ENTITY = "entity",
    ENTITY_ID = "entityid",
    REFERRER_SOURCE = "referrersource",
    SKU = "sku",
    SOURCE_ATTRIBUTE = "source_attribute"
}

export enum sourceAttribute {
    CUSTOM_CSS = "customcss",
    CUSTOM_JAVASCRIPT = "customjavascript",
}

export enum httpMethod {
    PATCH = "PATCH",
    GET = "GET",
    POST = "POST",
    DELETE = "DELETE",
}

export enum portalSchemaVersion {
    V1 = "portalschemav1",
    V2 = "portalschemav2",
}

export const MICROSOFT_GRAPH_USERS_BASE_URL = "https://graph.microsoft.com/v1.0/users/";

export enum GraphService {
    GRAPH_MAIL = "mail",
    GRAPH_PROFILE_PICTURE = "profilePicture",
}

export enum REFERRER {
    POWER_PAGES_HOME = "PowerPagesHome"
}

export const MICROSOFT_GRAPH_PROFILE_PICTURE_SERVICE_CALL = "/photo/$value";

// User collaboration constants
export const USER_COLLABORATION_CONTEXT_VALUE = "userNode";
export const THEME_ICON_ACCOUNT = "account";
export const THEME_ICON_MAIL = "mail";
export const START_TEAMS_CHAT = "Start Teams Chat";
export const SEND_AN_EMAIL = "Send an email";
export const WEB_EXTENSION_TEAMS_CHAT_NOT_AVAILABLE = "Teams chat is not available for this user";
export const WEB_EXTENSION_SEND_EMAIL_NOT_AVAILABLE = "Send email is not available for this user";
export const WEB_EXTENSION_QUICK_PICK_TITLE = "People on this file"
export const WEB_EXTENSION_QUICK_PICK_PLACEHOLDER = "Search for people";
export const WEB_EXTENSION_COLLABORATION_OPTIONS_CONTACT = "Contact";

//Business logic constants
export const SERVERLOGICS = "server-logics";
