/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import vscode from "vscode";

export const sendIconSvg = ` <svg width="16px" height="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path
  d="M1.17683 1.1185C1.32953 0.989145 1.54464 0.963297 1.72363 1.05279L14.7236 7.55279C14.893 7.63748 15 7.81061 15 8C15 8.18939 14.893 8.36252 14.7236 8.44721L1.72363 14.9472C1.54464 15.0367 1.32953 15.0109 1.17683 14.8815C1.02414 14.7522 0.96328 14.5442 1.02213 14.353L2.97688 8L1.02213 1.64705C0.96328 1.45578 1.02414 1.24785 1.17683 1.1185ZM3.8693 8.5L2.32155 13.5302L13.382 8L2.32155 2.46979L3.8693 7.5H9.50001C9.77615 7.5 10 7.72386 10 8C10 8.27614 9.77615 8.5 9.50001 8.5H3.8693Z"
  class="send-icon" />
</svg>`;

export const CodiconStylePathSegments = ['src', 'common', 'copilot', 'assets', 'styles', 'codicon.css'];
export const CopilotStylePathSegments = ['src', 'common', 'copilot', 'assets', 'styles', 'copilot.css'];
export const EUROPE_GEO = 'eu';
export const UK_GEO = 'uk';
export const COPILOT_UNAVAILABLE = 'copilotunavailable';
export const AUTH_CREATE_MESSAGE = vscode.l10n.t('Creating new authentication profile');
export const AUTH_CREATE_FAILED = vscode.l10n.t("Error creating auth profile for org")
export const RELEVANCY_CHECK_FAILED = 'RelevancyCheckFailed';
export const INAPPROPRIATE_CONTENT = 'InappropriateContentDetected';
export const INPUT_CONTENT_FILTERED = 'InputContentFiltered';
export const PROMPT_LIMIT_EXCEEDED = 'PromptLimitExceeded';
export const INVALID_INFERENCE_INPUT = 'InvalidInferenceInput';
export const COPILOT_NOTIFICATION_DISABLED = 'isCopilotNotificationDisabled'
export const EXPLAIN_CODE = 'explainCode';
export const SELECTED_CODE_INFO = "selectedCodeInfo";
export const SELECTED_CODE_INFO_ENABLED = true;
export const THUMBS_UP = 'thumbsUp';
export const THUMBS_DOWN = 'thumbsDown';
export const ADX_ENTITYFORM = "adx_entityform";
export const ADX_ENTITYLIST = "adx_entitylist";
export const ATTRIBUTE_DESCRIPTION = 'description';
export const ATTRIBUTE_DATAFIELD_NAME = 'datafieldname';
export const ATTRIBUTE_CLASSID = 'classid';
export const SYSTEFORMS_API_PATH = 'api/data/v9.2/systemforms';
export const COPILOT_IN_POWERPAGES = 'Copilot In Power Pages'
export const EXTENSION_VERSION_KEY = 'extensionVersion';

export type WebViewMessage = {
    type: string;
    value?: string | number | boolean | object;
    envName?: string;
};

export const DataverseEntityNameMap = new Map<string, string>([
    ['webpage', 'adx_webpage'],
    ['list', 'adx_entitylist'],
    ['webtemplate', 'adx_webtemplate'],
    ['basicform', 'adx_entityform'],
    ['advancedformstep', 'adx_entityform'],
]);

export const EntityFieldMap = new Map<string, string>([
    ['custom_javascript', 'adx_customjavascript'],
    ['source', 'adx_source'],
    ['copy', 'adx_copy']
]);

export const FieldTypeMap = new Map<string, string>([
    ['js', 'js'],
    ['html', 'html'],
    ['css', 'css']
]);

export const ControlClassIdMap = new Map<string, string>([
    ['5B773807-9FB2-42DB-97C3-7A91EFF8ADFF', 'DateTimeControl'],
    ['270BD3DB-D9AF-4782-9025-509E298DEC0A', 'LookupControl'],
    ['67FAC785-CD58-4F9F-ABB3-4B7DDC6ED5ED', 'BooleanControl'], // Radio control
    ['B0C6723A-8503-4FD7-BB28-C8A06AC933C2', 'CheckboxControl'],
    ['3EF39988-22BB-4F0B-BBBE-64B5A3748AEE', 'ChoiceControl'] // Picklist control
]);

export const GITHUB_COPILOT_CHAT_EXT = 'github.copilot-chat';
export const PowerPagesParticipantPrompt = '@powerpages how can you help with coding for my website?'
export const PowerPagesParticipantDocLink = 'https://go.microsoft.com/fwlink/?linkid=2276973';

export const AuthProfileNotFound = [{ displayText: "Active auth profile is not found or has expired. Create an Auth profile to start chatting with Copilot again.", code: '' }];
export const NetworkError = [{ displayText: "There was an issue connecting to the server. Please check your internet connection and try again.", code: '' }];
export const InvalidResponse = [{ displayText: "Something went wrong. Don’t worry, you can try again.", code: '' }];
export const MalaciousScenerioResponse = [{ displayText: "Try a different prompt that’s related to writing code for Power Pages sites. You can get help with HTML, CSS, and JS languages.", code: '' }];
export const PromptLimitExceededResponse = [{ displayText: "Please try again with a shorter prompt.", code: '' }];
export const RateLimitingResponse = [{ displayText: "Too many requests at once. Try again after some time.", code: '' }];
export const UnauthorizedResponse = [{ displayText: "Unauthorized access. Please log in with valid credentials and try again.", code: '' }];
