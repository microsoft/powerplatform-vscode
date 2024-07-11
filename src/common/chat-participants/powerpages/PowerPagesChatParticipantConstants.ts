/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ADX_ENTITYFORM, ADX_ENTITYLIST } from '../../copilot/constants';

export const NO_PROMPT_MESSAGE = vscode.l10n.t('Please provide a prompt to get started.\n You can get help with writing code for Power Pages sites in HTML, CSS, and JS languages.');
export const POWERPAGES_CHAT_PARTICIPANT_ID = 'powerpages';
export const RESPONSE_AWAITED_MSG = vscode.l10n.t('Working on it...');
export const AUTHENTICATION_FAILED_MSG = vscode.l10n.t('Authentication failed. Please try again.');
export const COPILOT_NOT_AVAILABLE_MSG = vscode.l10n.t('Copilot is not available. Please contact your administrator.');
export const PAC_AUTH_NOT_FOUND = vscode.l10n.t('Active auth profile is not found or has expired. Please try again.');
export const SUPPORTED_ENTITIES = [ADX_ENTITYFORM, ADX_ENTITYLIST];
// Telemetry Event Names
export const VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_INVOKED = 'GitHubPowerPagesAgentInvoked';
export const VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS = 'GitHubPowerPagesAgentOrgDetails';
export const VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS_NOT_FOUND = 'GitHubPowerPagesAgentOrgDetailsNotFound';
export const VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO = 'GitHubPowerPagesAgentScenario';
export const SKIP_CODES = ["", null, undefined, "violation", "unclear", "explain"];


