/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const CopilotDisclaimer = `Make sure AI-generated content is accurate and appropriate before using. <a href="https://go.microsoft.com/fwlink/?linkid=2240145">Learn more</a> | <a href="#">View
terms</a>`;
export const CodiconStylePathSegments = [ 'src', 'common', 'copilot', 'assets', 'styles', 'codicon.css'];
export const CopilotStylePathSegments = [ 'src', 'common', 'copilot', 'assets', 'styles', 'copilot.css'];


export type WebViewMessage = {
    type: string;
    value?: string | number | boolean | object;
    envName?: string;
  };
  

export const DataverseEntityNameMap = new Map<string, string> ([
  ['webpage', 'adx_webpage'],
  ['list', 'adx_entitylist'],
  ['webtemplate', 'adx_webtemplate'],
  ['basicform', 'adx_entityform'],
  ['advancedformstep', 'adx_entityform'],
]);

export const EntityFieldMap = new Map<string, string> ([
  ['custom_javascript', 'adx_customjavascript'],
  ['source', 'adx_source'],
  ['copy', 'adx_copy']
]);

export const FieldTypeMap = new Map<string, string> ([
  ['js', 'JavaScript'],
  ['html', 'html']
]);

export const AuthProfileNotFound =   [{ displayText: "Auth Profile not found or expired. Create an Auth profile to start chatting with Copilot again.", code: '' }];
export const NetworkError = [{ displayText: "There was an issue connecting to the server. Don’t worry, you can try again.", code: '' }];
export const InvalidResponse = [{ displayText: "Something went wrong. Don’t worry, you can try again.", code: '' }];