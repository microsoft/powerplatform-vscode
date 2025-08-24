/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { EXTENSION_NAME } from "../../../common/constants";
import { getExtensionVersion } from "../../../common/utilities/Utils";

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

export enum FormConstants {
    BasicForm = '[aria-label="Basic Form"]',
    EmailField = '[aria-label="Email"]',
    SubjectField = '[id="title"]',
    MessageField = '[aria-label="Message"]',
    SubmitButton = '[id="InsertButton"]',
    NameIsRequired = "//li[text()='Name is a required field.']",
    NameField = 'input[id="adx_createdbycontact"]',
    MinimumRating = 'input[id="minrating"]',
    MaximumRating = 'input[id="maxrating"]',
    SubmissionSuccessful = "//span[text()='Submission completed successfully.']",
    ValidEmail = "//li[text()='Please enter a valid email address.']",
    SpecialCharacters = "//li[text()='{0} cannot contain special characters.']",
    Lessthan5Characters = "//li[text()='Name must be less than 5 characters.']",
    ValidationSummary = '[class*="validation-summary"]',
    RatingBeAtleast10 = "//li[text()='Minimum rating must be at least 10.']",
    RatingBeAtmost95 = "//li[text()='Maximum Rating must not be greater than 95.']",
    RatingBeAtleast5 = "//li[text()='Minimum Rating must be at least 5.']",
    RatingAtmost95 = "//li[text()='Maximum Rating must be at most 95.']",
}

export enum ListConstants {
    DataRecord = 'tr[data-name="rf"]',
    AmountColumn = '[data-attribute="cr1ae_amount"]',
}

export enum AdvanceFormConstants {
    PhoneField = '#telephone1',
    NameField = '#name',
    NextButton = '#NextButton',
    EmailField = '#emailaddress1',
    ValidationSummary = '#ValidationSummaryEntityFormView li',
    PreviousButton = '#PreviousButton',
    AccountNumber = '#accountnumber',
    MessageLabel = '#MessageLabel'
}

export enum PageConstants {
    TestButton = "//button[text()='Test']",
    MicrosoftURL = 'https://www.microsoft.com/en-in/',
    MicrosoftLogo = 'img[alt="Microsoft Logo"]',
    Button = '[type="button"][class*="button"]',
    RedColor = 'rgb(255, 0, 0)',
    Button1 = '[class="button1"]',
    YellowColor = 'rgb(255, 255, 0)',
    Section = '.sectionBlockLayout:first-of-type',
    GreenColor = 'rgb(0, 128, 0)'
}

export enum TextConstants{
    MicrosoftURL = 'https://www.microsoft.com/en-in/',
    Italic = 'italic'
}

export enum FormQueries {
    Query1 = "Write JavaScript code for name field validation in form.",
    Query2 = "Write JavaScript code to hide email field in form.",
    Query3 = "Write JavaScript code to disable email field in form.",
    Query4 = "Write JavaScript code for form field validation to check email field value is in the valid format.",
    Query5 = "Write JavaScript code to add field validation to check for the length of the name field to be less than 5",
    Query6 = "Write Javascript code to add field validation to check for the value of the minimum rating field to not to be less than 10.",
    Query7 = "Write Javascript code to add field validation to check for the value of the maximum rating field to not to be greater than 95.",
    Query8 = "Write Javascript code to add field validation to check for the value of the minimum rating field to not to be less than 5 and maximum rating not to be greater than 95."
}
export enum AdvancedFormQueries {
    Query1 = "Write JavaScript code for Phone field validation to check phone field value is in the valid format.",
    Query2 = "Write javascript code to rename Next button to Forward",
    Query3 = "Write javascript code to make Phone field a required field",
    Query4 = "Write javascript code for Account Number field to accept only numbers",
    Query5 = "Write javascript code to make email field readonly in the form",
}

export enum ListQueries {
    Query1 = "Write JavaScript code to highlight the row where title column value is rf in table list.",
    Query2 = "Write javascript code to Mark rows with amount > 500 with yellow and amount datatype is dollars",
    Query3 = "write javascript code to arrange amount column values in descending order",
    Query4 = "write javascript code to arrange amount column values in ascending order",
}

export enum HtmlQueries {
    Query1 = "Write code to add 'Account' entity form to my webpage 'html' with some section code.",
    Query2 = "Write code to add a button with name Test which should redirect to microsoft.com url.",
    Query3 = "Write html code to add an image for microsoft and choose image from online",
}

export enum CssQueries {
    Query1 = "Write css code to change the first section color of home page to yellow",
    Query2 = "Write css code to change first existing button background color to red",
    Query3 = "Write css code to change button text to italic for all buttons",
    Query4 = "Write css code to update first existing button background color to green important on hover",
}

export enum Paths{
    HtmlWebpageCopy = "C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-uo67k\\web-pages\\html\\content-pages\\Html.en-US.webpage.copy.html",
    HomePageCss = 'C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-uo67k\\web-pages\\home\\content-pages\\Home.en-US.webpage.custom_css.css',
    ListJsFile = 'C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-uo67k\\lists\\Active-Feedback.list.custom_javascript.js',
    FormJsFile = 'C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-uo67k\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js',
    AdvFormStep1JsFile = 'C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-uo67k\\advanced-forms\\multistep-form-1\\advanced-form-steps\\step1\\Step1.advancedformstep.custom_javascript.js',
    AdvFormStep2JsFile = 'C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-uo67k\\advanced-forms\\multistep-form-1\\advanced-form-steps\\step2\\Step2.advancedformstep.custom_javascript.js'
}

// Copilot constants
export const AIB_ENDPOINT = 'https://aibuildertextapiservice.us-il108.gateway.prod.island.powerapps.com/v1.0/63efacda-3db4-ee11-a564-000d3a106f1e/appintelligence/chat';


// JSON request to be sent to the API.
export const ApiRequestJson = {
    "question": "{0}",
    "top": 1,
    "context": 
    {
        "scenario": "PowerPagesProDev",
        "subScenario": "PowerPagesProDevGeneric",
        "version": "V1",
        "information": 
        {
            "activeFileContent": "{6}",
            "dataverseEntity": "{2}",
            "entityField": "{3}",
            "fieldType": "{4}",
            "targetEntity": "{5}",
            "targetColumns": "{1}",  // Placeholder value for targetColumns
            "clientType": EXTENSION_NAME + '-' + 'Desktop',
            "clientVersion": getExtensionVersion()
        }
    }
};

export const ExpectedResponses = {
    COPILOT_IT_UNSUPPORTED_EXPECTED_RESPONSE: {
        "displayText":"Try a different prompt thatâ€™s related to writing code for Power Pages sites. You can get help with HTML, CSS, and JS languages.",
        "Code":"violation",
        "language":"text",
        "useCase":"unsupported"
    }
};

export const SuggestedPromptsConstants : Record<string, string> = { 
    // Name: "Write javascript code to validate name field to not accept special characters",
    Subject: "Write javascript code to validate subject field to not accept special characters",
}