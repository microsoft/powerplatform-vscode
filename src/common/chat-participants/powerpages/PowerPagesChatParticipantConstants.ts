/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ADX_ENTITYFORM, ADX_ENTITYLIST } from '../../copilot/constants';
import { CreateSiteCommand } from './commands/create-site/CreateSiteCommand';

// Constants
export const POWERPAGES_CHAT_PARTICIPANT_ID = 'powerpages';
export const STATER_PROMPTS = "starterPrompts"
export const WELCOME_PROMPT = 'how can you help with coding for my website?'
export const SUPPORTED_ENTITIES = [ADX_ENTITYFORM, ADX_ENTITYLIST];
export const SKIP_CODES = ["", null, undefined, "violation", "unclear", "explain"];
export const RESPONSE_SCENARIOS = {
    PAC_AUTH_NOT_FOUND: 'PAC_AUTH_NOT_FOUND',
    AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
    COPILOT_NOT_AVAILABLE: 'COPILOT_NOT_AVAILABLE',
    INVALID_RESPONSE: 'INVALID_RESPONSE',
    RESPONSE_AWAITED: 'RESPONSE_AWAITED',
    NO_PROMPT: 'NO_PROMPT',
    EXPLAIN_CODE_PROMPT: 'EXPLAIN_CODE_PROMPT',
    FORM_PROMPT: 'FORM_PROMPT',
    LIST_PROMPT: 'LIST_PROMPT',
    WEB_API_PROMPT: 'WEB_API_PROMPT',
    WELCOME_PROMPT: 'WELCOME_PROMPT',
    COPILOT_NOT_RELEASED: 'COPILOT_NOT_RELEASED'
};

// Localized strings
export const EXPLAIN_CODE_PROMPT = vscode.l10n.t('Explain the following code {% include \'Page Copy\'%}');
export const WEB_API_PROMPT = vscode.l10n.t('Write web API code to query active contact records.');
export const FORM_PROMPT = vscode.l10n.t('Write JavaScript code for form field validation to check phone field value is in the valid format.');
export const LIST_PROMPT = vscode.l10n.t('Write JavaScript code to highlight the row where email field is empty in table list.');
export const WELCOME_MESSAGE = vscode.l10n.t('Hi! @powerpages can help you write, edit, and even summarize your website code.')
export const RESPONSE_AWAITED_MSG = vscode.l10n.t('Working on it...');
export const AUTHENTICATION_FAILED_MSG = vscode.l10n.t('Authentication failed. Please login and try again.');
export const COPILOT_NOT_AVAILABLE_MSG = vscode.l10n.t('AI features have been disabled by your organization. Contact your admin for details. [Learn more](https://go.microsoft.com/fwlink/?linkid=2285848)');
export const PAC_AUTH_NOT_FOUND = vscode.l10n.t('Active auth profile is not found or has expired. Please try again.');
export const INVALID_RESPONSE = vscode.l10n.t('Something went wrong. Don’t worry, you can try again.');
export const DISCLAIMER_MESSAGE = vscode.l10n.t('Make sure AI-generated content is accurate and appropriate before using. [Learn more](https://go.microsoft.com/fwlink/?linkid=2240145) | [View terms](https://go.microsoft.com/fwlink/?linkid=2189520)');
export const NO_PROMPT_MESSAGE = vscode.l10n.t('Hi! Power Pages lets you build secure, professional websites that you can quickly configure and publish across web browsers and devices.\n\nTo create your website, visit the [Power Pages](https://powerpages.microsoft.com/).\nReturn to this chat and @powerpages can help you write and edit your website code.');
export const PAC_AUTH_INPUT = vscode.l10n.t("Checking for active auth profile...");
export const COPILOT_NOT_RELEASED_MSG = vscode.l10n.t("@PowerPages is not yet available in your region.")
export const LOGIN_BTN_CMD = 'powerpages-login';
export const LOGIN_BTN_TITLE = vscode.l10n.t('Login');
export const LOGIN_BTN_TOOLTIP = vscode.l10n.t('Login to PowerPages');
export const NL2PAGE_REQUEST_FAILED = 'Request failed for page type:';
export const NL2SITE_INVALID_RESPONSE = 'Invalid response structure';
export const HOME_PAGE_TYPE = 'Home';
export const ABOUT_PAGE_TYPE = 'AboutUs';
export const FAQ_PAGE_TYPE = 'FAQ';
export const INFO_PAGE_TYPE = 'Informational';
export const NL2PAGE_SCENARIO = 'NL2Page';
export const NL2SITE_SCENARIO = 'NL2Site';
export const NL2PAGE_GENERATE_NEW_PAGE = 'GenerateNewPage';
export const NL2SITE_GENERATE_NEW_SITE = 'GenerateNewSite';
export const NL2PAGE_SCOPE = 'Page';
export const NL2SITE_REQUEST_FAILED = 'Failed to get site content from NL2Site service';
export const NL2PAGE_GENERATING_WEBPAGES = vscode.l10n.t("Generating webpages...");
export const NL2PAGE_RESPONSE_FAILED = 'Failed to get page content from NL2Page service';
export const NL2SITE_GENERATING_SITE = vscode.l10n.t("Generating a new Power Pages site...");
export const FAILED_TO_CREATE_SITE = vscode.l10n.t('Failed to create a new Power Pages site. Please try again.');
export const POWERPAGES_COMMANDS = {
    'create-site': new CreateSiteCommand()
}
