/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


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