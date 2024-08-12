/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ADX_ENTITYFORM, ADX_ENTITYLIST } from '../../copilot/constants';

export const NO_PROMPT_MESSAGE = vscode.l10n.t('Hi! Power Pages lets you build secure, professional websites that you can quickly configure and publish across web browsers and devices.\n\nTo create your website, visit the [Power Pages](https://powerpages.microsoft.com/).\nReturn to this chat and @powerpages can help you write and edit your website code.');
export const POWERPAGES_CHAT_PARTICIPANT_ID = 'powerpages';
export const RESPONSE_AWAITED_MSG = vscode.l10n.t('Working on it...');
export const AUTHENTICATION_FAILED_MSG = vscode.l10n.t('Authentication failed. Please try again.');
export const COPILOT_NOT_AVAILABLE_MSG = vscode.l10n.t('Copilot is not available. Please contact your administrator.');
export const PAC_AUTH_NOT_FOUND = vscode.l10n.t('Active auth profile is not found or has expired. Please try again.');
export const DISCLAIMER_MESSAGE = vscode.l10n.t('Make sure AI-generated content is accurate and appropriate before using. [Learn more](https://go.microsoft.com/fwlink/?linkid=2240145) | [View terms](https://go.microsoft.com/fwlink/?linkid=2189520)');
export const SUPPORTED_ENTITIES = [ADX_ENTITYFORM, ADX_ENTITYLIST];
// Telemetry Event Names
export const VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_INVOKED = 'GitHubPowerPagesAgentInvoked';
export const VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS = 'GitHubPowerPagesAgentOrgDetails';
export const VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS_NOT_FOUND = 'GitHubPowerPagesAgentOrgDetailsNotFound';
export const VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO = 'GitHubPowerPagesAgentScenario';
export const SKIP_CODES = ["", null, undefined, "violation", "unclear", "explain"];
export const EXPLAIN_CODE_PROMPT = vscode.l10n.t('Explain the following code {% include \'Page Copy\'%}');
export const WEB_API_PROMPT = vscode.l10n.t('Write web API code to query active contact records.');
export const FORM_PROMPT = vscode.l10n.t('Write JavaScript code for form field validation to check phone field value is in the valid format.');
export const LIST_PROMPT = vscode.l10n.t('Write JavaScript code to highlight the row where email field is empty in table list.');
export const STATER_PROMPTS = "starterPrompts"
export const WELCOME_PROMPT = 'how can you help with coding for my website?'
export const WELCOME_MESSAGE = vscode.l10n.t('Hi! @powerpages can help you write, edit, and even summarize your website code.')


